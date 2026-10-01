import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getFishCatch, getFishCatches, catchPhotoUrl } from '../src/api/fishCatch.js'

test('loads one catch with authentication and cancellation', async (t) => {
  const signal = new AbortController().signal
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/fishcatch/42')
    assert.equal(options.headers.Authorization, 'Bearer session')
    assert.equal(options.signal, signal)
    return new Response(JSON.stringify({ id: 42, species: null, weight: 0 }))
  })
  const result = await getFishCatch('42', 'session', signal)
  assert.equal(result.weight, 0)
  assert.equal(result.species, null)
})

test('distinguishes a missing catch from a malformed successful response', async (t) => {
  const mock = t.mock.method(
    globalThis,
    'fetch',
    async () => new Response('{"error":"Not found"}', { status: 404 }),
  )
  await assert.rejects(getFishCatch('42'), (error) => error.status === 404)
  mock.mock.mockImplementation(async () => new Response('{"error":"Invalid catch"}'))
  await assert.rejects(getFishCatch('42'), /unexpected catch/)
  mock.mock.mockImplementation(async () => new Response('{"id":43}'))
  await assert.rejects(getFishCatch('42'), /unexpected catch/)
})

test('resolves API photos and excludes default or unsupported photo URLs', () => {
  assert.equal(catchPhotoUrl('/uploads/fish.jpg'), '/api/uploads/fish.jpg')
  assert.equal(catchPhotoUrl('uploads/fish.jpg'), '/api/uploads/fish.jpg')
  assert.equal(catchPhotoUrl('https://photos.example/fish.jpg'), 'https://photos.example/fish.jpg')
  for (const path of [
    null,
    '',
    '/static/images/stock-fish.jpg',
    'javascript:alert(1)',
    '//photos.example/a.jpg',
  ])
    assert.equal(catchPhotoUrl(path), null)
})

test('loads only the requested user’s catches with authentication and cancellation', async (t) => {
  const signal = new AbortController().signal
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const parsed = new URL(url, 'http://localhost')
    assert.equal(parsed.pathname, '/api/fishcatch')
    assert.equal(parsed.searchParams.get('user_id'), '7')
    assert.equal(parsed.searchParams.get('orderBy'), 'date:DESC')
    assert.equal(options.headers.Authorization, 'Bearer session')
    assert.equal(options.signal, signal)
    return new Response('[{"id":42,"species":null}]')
  })
  assert.deepEqual(await getFishCatches(7, 'session', signal), [{ id: 42, species: null }])
})

test('recognizes the API empty-list response without hiding other failures', async (t) => {
  const mock = t.mock.method(
    globalThis,
    'fetch',
    async () =>
      new Response('{"error":"No fish catches found matching criteria"}', { status: 404 }),
  )
  assert.deepEqual(await getFishCatches(7), [])
  for (const status of [401, 403, 404, 500]) {
    mock.mock.mockImplementation(async () => new Response('{"error":"Request failed"}', { status }))
    await assert.rejects(getFishCatches(7), (error) => error.status === status)
  }
  for (const data of [{}, [null], [{ species: {} }]]) {
    mock.mock.mockImplementation(async () => new Response(JSON.stringify(data)))
    await assert.rejects(getFishCatches(7), /unexpected catch list/)
  }
})

test('does not send an unscoped catch-list request', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('Must not fetch')
  })
  await assert.rejects(getFishCatches(null), /user is required/)
  assert.equal(mock.mock.callCount(), 0)
})

test('creates a catch with decimal measurements, local date/time, and an absolute timestamp', async (t) => {
  const { createFishCatch, localDateTime } = await import('../src/api/fishCatch.js')
  const signal = new AbortController().signal
  const datetime = localDateTime(new Date(2026, 8, 29, 10, 30))
  assert.equal(datetime, '2026-09-29T10:30')
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/fishcatch')
    assert.equal(options.method, 'POST')
    assert.equal(options.headers.Authorization, 'Bearer session')
    assert.equal(options.signal, signal)
    assert.deepEqual(JSON.parse(options.body), {
      species_id: 1,
      lake_id: 2,
      lure_id: 3,
      length: 0,
      weight: 2.5,
      date: '2026-09-29',
      time: '10:30:00',
      timestamp: Math.floor(new Date(datetime).getTime() / 1000),
    })
    return Response.json({ id: 7 }, { status: 201 })
  })
  assert.equal(
    (
      await createFishCatch(
        {
          species_id: '1',
          lake_id: '2',
          lure_id: '3',
          length: '0',
          weight: '2.5',
          datetime,
          user_id: 999,
        },
        'session',
        signal,
      )
    ).id,
    7,
  )
})

test('invalid catch data never submits and failed saves preserve HTTP status', async (t) => {
  const { createFishCatch } = await import('../src/api/fishCatch.js')
  const valid = {
    species_id: 1,
    lake_id: 2,
    lure_id: 3,
    length: 10,
    weight: 0,
    datetime: '2026-09-29T10:30',
  }
  const mock = t.mock.method(globalThis, 'fetch', async () => Response.json({ id: 7 }))
  for (const patch of [
    { species_id: '' },
    { lure_id: -1 },
    { length: '' },
    { weight: -1 },
    { datetime: '' },
    { datetime: '2026-02-30T10:30' },
  ])
    await assert.rejects(
      createFishCatch({ ...valid, ...patch }, 'session'),
      (error) => error.status === 400,
    )
  assert.equal(mock.mock.callCount(), 0)
  for (const status of [400, 401, 500]) {
    mock.mock.mockImplementation(async () => Response.json({ error: 'Unable to save' }, { status }))
    await assert.rejects(createFishCatch(valid, 'session'), (error) => error.status === status)
  }
  mock.mock.mockImplementation(async () => Response.json({ message: 'Unexpected' }))
  await assert.rejects(createFishCatch(valid, 'session'), /unexpected catch/)
})

test('fish mode requests only the signed-in user’s selected day', async (t) => {
  const signal = new AbortController().signal
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const query = new URL(url, 'http://localhost').searchParams
    assert.equal(query.get('user_id'), '42')
    assert.equal(query.get('date'), '2026-09-29')
    assert.equal(options.headers.Authorization, 'Bearer session')
    assert.equal(options.signal, signal)
    return Response.json([{ id: 7, date: '2026-09-29' }])
  })
  const { getFishCatches } = await import('../src/api/fishCatch.js')
  assert.equal((await getFishCatches(42, 'session', signal, '2026-09-29')).length, 1)
})

test('a successful catch preserves the weather warning for save confirmations', async (t) => {
  const { createFishCatch } = await import('../src/api/fishCatch.js')
  t.mock.method(
    globalThis,
    'fetch',
    async () =>
      new Response(
        JSON.stringify({
          id: 42,
          weather_warning: 'Weather could not be recorded for this catch.',
        }),
        { status: 201 },
      ),
  )
  const result = await createFishCatch(
    { species_id: 1, lake_id: 2, lure_id: 3, length: 12, weight: 1, datetime: '2026-09-29T10:30' },
    'session',
  )
  assert.equal(result.id, 42)
  assert.equal(result.weather_warning, 'Weather could not be recorded for this catch.')
})
