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
