import { test } from 'node:test'
import assert from 'node:assert/strict'
import { request, ApiError } from '../src/api/client.js'

test('sends a bounded dashboard request with bearer token and cancellation', async (t) => {
  let received
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    received = { url, options }
    return new Response(JSON.stringify({ stats: { totalCatches: 0 }, recentCatches: [] }))
  })
  const controller = new AbortController()
  const response = await request('/dashboard', { token: 'test', signal: controller.signal })
  assert.equal(received.url, '/api/dashboard')
  assert.equal(received.options.headers.Authorization, 'Bearer test')
  assert.equal(received.options.signal, controller.signal)
  assert.equal(response.stats.totalCatches, 0)
})
test('encodes sign-in without attaching a bearer token', async (t) => {
  let options
  t.mock.method(globalThis, 'fetch', async (_, value) => {
    options = value
    return new Response('{"token":"test"}')
  })
  await request('/users/login', {
    method: 'POST',
    body: { username: 'angler', password: 'example' },
  })
  assert.equal(options.headers.Authorization, undefined)
  assert.equal(options.headers['Content-Type'], 'application/json')
  assert.equal(JSON.parse(options.body).username, 'angler')
})
test('preserves HTTP status for expired sessions', async (t) => {
  t.mock.method(
    globalThis,
    'fetch',
    async () => new Response('{"error":"Unauthorized"}', { status: 401 }),
  )
  await assert.rejects(
    request('/dashboard'),
    (error) => error instanceof ApiError && error.status === 401,
  )
})
test('reports invalid successful responses and propagates connection failures', async (t) => {
  const fetch = t.mock.method(
    globalThis,
    'fetch',
    async () => new Response('<html>bad proxy</html>'),
  )
  await assert.rejects(request('/dashboard'), /unexpected response/)
  fetch.mock.mockImplementation(async () => {
    throw new TypeError('Failed to fetch')
  })
  await assert.rejects(request('/dashboard'), /Failed to fetch/)
})
