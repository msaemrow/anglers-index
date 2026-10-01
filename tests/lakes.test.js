import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getLakes, getLake, lakeCoordinates } from '../src/api/lakes.js'

test('loads lakes with cancellation and accepts an empty directory', async (t) => {
  const signal = new AbortController().signal
  const mock = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/lakes')
    assert.equal(options.signal, signal)
    return new Response('[{"id":1,"name":"Test Lake"}]')
  })
  assert.equal((await getLakes(signal))[0].name, 'Test Lake')
  mock.mock.mockImplementation(async () => new Response('[]'))
  assert.deepEqual(await getLakes(), [])
  mock.mock.mockImplementation(async () => new Response('{"error":"Unexpected"}'))
  await assert.rejects(getLakes(), /unexpected lake list/)
})

test('loads an individual lake and distinguishes missing, failed, and malformed responses', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async (url) => {
    assert.equal(url, '/api/lakes/7')
    return new Response('{"id":7,"name":"Test Lake"}')
  })
  assert.equal((await getLake('7')).id, 7)
  for (const status of [404, 500]) {
    mock.mock.mockImplementation(
      async () => new Response('{"error":"Lake unavailable"}', { status }),
    )
    await assert.rejects(getLake(7), (error) => error.status === status)
  }
  mock.mock.mockImplementation(async () => new Response('{"id":8}'))
  await assert.rejects(getLake(7), /unexpected lake/)
})

test('validates coordinates without turning missing values into zero', () => {
  assert.deepEqual(lakeCoordinates({ latitude: '44.5', longitude: '-93.1' }), [-93.1, 44.5])
  assert.deepEqual(lakeCoordinates({ latitude: 0, longitude: 0 }), [0, 0])
  assert.deepEqual(lakeCoordinates({ latitude: -90, longitude: 180 }), [180, -90])
  for (const value of [null, undefined, '', ' ', 'invalid', Infinity, false, [], {}]) {
    assert.equal(lakeCoordinates({ latitude: value, longitude: 10 }), null)
    assert.equal(lakeCoordinates({ latitude: 10, longitude: value }), null)
  }
  assert.equal(lakeCoordinates({ latitude: 91, longitude: 0 }), null)
  assert.equal(lakeCoordinates({ latitude: 0, longitude: -181 }), null)
  assert.equal(lakeCoordinates(null), null)
})

test('creates and updates lakes with exact selected coordinates', async (t) => {
  const { saveLake } = await import('../src/api/lakes.js')
  const signal = new AbortController().signal
  const fields = {
    name: ' Test Lake ',
    nearest_town: ' Duluth ',
    state: 'MN',
    county: ' St. Louis ',
    latitude: '0',
    longitude: '-92.1',
  }
  const mock = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(options.headers.Authorization, 'Bearer admin')
    assert.equal(options.signal, signal)
    const body = JSON.parse(options.body)
    assert.equal(body.name, 'Test Lake')
    assert.equal(body.nearest_town, 'Duluth')
    assert.equal(body.county, 'St. Louis')
    if (options.method === 'POST') {
      assert.equal(url, '/api/lakes')
      assert.equal(body.latitude, 0)
      assert.equal(body.longitude, -92.1)
    } else {
      assert.equal(options.method, 'PUT')
      assert.equal(url, '/api/lakes/7')
      assert.equal(body.latitude, 0)
      assert.equal(body.longitude, -92.1)
    }
    return Response.json({ id: 7, ...body })
  })
  assert.equal((await saveLake(fields, 'admin', undefined, signal)).id, 7)
  assert.equal((await saveLake(fields, 'admin', 7, signal)).id, 7)
  assert.equal(mock.mock.callCount(), 2)
})

test('rejects invalid lake edits before sending a request and preserves API failures', async (t) => {
  const { saveLake } = await import('../src/api/lakes.js')
  const fields = {
    name: 'Lake',
    nearest_town: 'Duluth',
    state: 'MN',
    county: 'St. Louis',
    latitude: 46,
    longitude: -92,
  }
  const mock = t.mock.method(globalThis, 'fetch', async () => Response.json({ id: 7 }))
  for (const field of ['name', 'nearest_town', 'state', 'county'])
    await assert.rejects(
      saveLake({ ...fields, [field]: ' ' }, 'admin'),
      (error) => error.status === 400,
    )
  for (const latitude of ['', null, 'invalid', 91])
    await assert.rejects(
      saveLake({ ...fields, latitude }, 'admin', 7),
      (error) => error.status === 400,
    )
  assert.equal(mock.mock.callCount(), 0)
  for (const status of [400, 401, 403, 404, 500]) {
    mock.mock.mockImplementation(async () => Response.json({ error: 'Save failed' }, { status }))
    await assert.rejects(saveLake(fields, 'admin', 7), (error) => error.status === status)
  }
  mock.mock.mockImplementation(async () => Response.json({ id: 8 }))
  await assert.rejects(saveLake(fields, 'admin', 7), /unexpected lake/)
})

test('new lakes use town fallback only when both coordinate fields are blank', async (t) => {
  const { saveLake } = await import('../src/api/lakes.js')
  const fields = {
    name: 'Lake',
    nearest_town: 'Town',
    state: 'MN',
    county: 'County',
    latitude: '',
    longitude: '',
  }
  const mock = t.mock.method(globalThis, 'fetch', async (_, options) => {
    const body = JSON.parse(options.body)
    assert.equal('latitude' in body, false)
    assert.equal('longitude' in body, false)
    return Response.json({ id: 7 })
  })
  await saveLake(fields, 'admin')
  for (const patch of [
    { latitude: 45 },
    { longitude: -93 },
    { latitude: 91, longitude: 0 },
    { latitude: 0, longitude: -181 },
  ])
    await assert.rejects(
      saveLake({ ...fields, ...patch }, 'admin'),
      (error) => error.status === 400,
    )
  assert.equal(mock.mock.callCount(), 1)
})
