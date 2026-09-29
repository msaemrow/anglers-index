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
