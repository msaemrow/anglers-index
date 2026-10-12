import { mockApi } from './helpers/mockApi.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { request, ApiError } from '../src/api/client.js'

test('sends a bounded dashboard request with bearer token and cancellation', async (t) => {
  let received
  mockApi(t, async (url, options) => {
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
  mockApi(t, async (_, value) => {
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
  mockApi(t, async () => new Response('{"error":"Unauthorized"}', { status: 401 }))
  await assert.rejects(
    request('/dashboard'),
    (error) => error instanceof ApiError && error.status === 401,
  )
})
test('reports invalid successful responses and propagates connection failures', async (t) => {
  const fetch = mockApi(t, async () => new Response('<html>bad proxy</html>'))
  await assert.rejects(request('/dashboard'), /unexpected response/)
  fetch.mock.mockImplementation(async () => {
    throw new TypeError('Failed to fetch')
  })
  await assert.rejects(request('/dashboard'), /Unable to connect to the server/)
})

test('uses custom API errors before generic status messages', async (t) => {
  const mock = mockApi(t, async () =>
    Response.json({ error: 'Lake already exists' }, { status: 400 }),
  )
  await assert.rejects(request('/lakes'), { message: 'Lake already exists', status: 400 })
  mock.mock.mockImplementation(async () =>
    Response.json({ message: 'Custom message' }, { status: 500 }),
  )
  await assert.rejects(request('/lakes'), { message: 'Custom message', status: 500 })
  mock.mock.mockImplementation(async () =>
    Response.json({ error: ' ', message: 'Try a different name' }, { status: 400 }),
  )
  await assert.rejects(request('/lakes'), { message: 'Try a different name' })
})

test('provides defaults for missing or unusable API messages', async (t) => {
  const mock = mockApi(t, async () => Response.json({}, { status: 403 }))
  const messages = {
    400: 'Invalid request. Please check your input.',
    401: 'Your session has expired. Please sign in again.',
    403: 'You don’t have permission to perform this action.',
    404: 'No data found.',
    500: 'Error processing request. Please try again.',
    503: 'Error processing request. Please try again.',
  }
  for (const [status, message] of Object.entries(messages)) {
    mock.mock.mockImplementation(async () =>
      Response.json({ error: {}, message: ' ' }, { status: Number(status) }),
    )
    await assert.rejects(request('/lakes'), { message, status: Number(status) })
  }
  mock.mock.mockImplementation(
    async () => new Response('<html>Proxy error</html>', { status: 502 }),
  )
  await assert.rejects(request('/lakes'), { message: messages[500], status: 502 })
})

test('does not turn cancellation into a displayed API error', async () => {
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(
    request('/lakes', { signal: controller.signal }),
    (error) =>
      error.name === 'AbortError' && error.code === 'ERR_CANCELED' && !(error instanceof ApiError),
  )
})
