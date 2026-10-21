import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decodeSession } from '../src/composables/session.js'

function token(claims) {
  return `e30.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`
}
const user = {
  user_id: 42,
  username: 'angler',
  first_name: 'José',
  exp: Math.floor(Date.now() / 1000) + 60,
}
test('reads a valid UTF-8 session', () => {
  assert.equal(decodeSession(token(user)).first_name, 'José')
})
test('rejects expired, malformed, and incomplete sessions', () => {
  for (const value of [
    '',
    'broken',
    undefined,
    token({ ...user, exp: 1 }),
    token({ username: 'angler' }),
    token({ ...user, exp: 'invalid' }),
  ])
    assert.equal(decodeSession(value), null)
})

test('centralizes authenticated expiration without affecting login failures or newer sessions', async (t) => {
  const { effectScope } = await import('vue')
  const { useSession } = await import('../src/composables/useSession.js')
  const { request, onSessionExpired } = await import('../src/api/client.js')
  const { mockApi } = await import('./helpers/mockApi.js')
  const storedToken = token(user)
  const storage = new Map([['anglers-index.session', storedToken]])
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  t.after(() => {
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage)
    else delete globalThis.localStorage
  })
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => storage.get(key),
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
  })
  const scope = effectScope()
  const session = scope.run(() => useSession())
  t.after(() => scope.stop())
  let notifications = 0
  const unsubscribe = onSessionExpired(() => notifications++)
  t.after(unsubscribe)
  const mock = mockApi(t, async () => Response.json({ error: 'Unauthorized' }, { status: 401 }))

  await assert.rejects(request('/users/login', { method: 'POST', body: {} }))
  assert.equal(session.token.value, storedToken)
  assert.equal(session.sessionError.value, '')
  assert.equal(notifications, 0)

  await assert.rejects(request('/dashboard', { token: 'old-session' }))
  assert.equal(session.token.value, storedToken)
  assert.equal(storage.get('anglers-index.session'), storedToken)

  await assert.rejects(request('/dashboard', { token: storedToken }))
  assert.equal(session.token.value, '')
  assert.equal(session.user.value, null)
  assert.equal(storage.has('anglers-index.session'), false)
  assert.match(session.sessionError.value, /session has expired/)

  const newToken = token({ ...user, username: 'new-angler' })
  mock.mock.mockImplementation(async () => Response.json({ token: newToken }))
  await session.signIn({ username: 'new-angler', password: 'example' })
  assert.equal(session.sessionError.value, '')
  mock.mock.mockImplementation(async () => Response.json({}, { status: 401 }))
  await assert.rejects(request('/dashboard', { token: storedToken }))
  assert.equal(session.token.value, newToken)

  scope.stop()
  await assert.rejects(request('/dashboard', { token: newToken }))
  assert.equal(session.token.value, newToken)
})

test('logout waits for API revocation, keeps the session on failure, and clears it on success', async (t) => {
  const { effectScope } = await import('vue')
  const { useSession } = await import('../src/composables/useSession.js')
  const { mockApi } = await import('./helpers/mockApi.js')
  const currentToken = token(user)
  const storage = new Map([['anglers-index.session', currentToken]])
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key),
  } })
  t.after(() => {
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage)
    else delete globalThis.localStorage
  })
  const scope = effectScope()
  const session = scope.run(() => useSession())
  t.after(() => scope.stop())
  let release
  mockApi(t, async (url, options) => {
    assert.match(url, /\/users\/logout$/)
    assert.equal(options.method, 'POST')
    assert.equal(options.headers.Authorization, `Bearer ${currentToken}`)
    return new Promise(resolve => { release = resolve })
  })
  const failed = session.signOut()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(session.signingOut.value, true)
  assert.equal(await session.signOut(), false, 'duplicate logout does not issue another request')
  assert.equal(session.token.value, currentToken)
  assert.equal(storage.get('anglers-index.session'), currentToken)
  release(Response.json({ error: 'Unavailable' }, { status: 503 }))
  assert.equal(await failed, false)
  assert.equal(session.token.value, currentToken)
  assert.match(session.sessionError.value, /still signed in/)
  const succeeded = session.signOut()
  await new Promise(resolve => setImmediate(resolve))
  release(Response.json({ message: 'Logout successful' }))
  assert.equal(await succeeded, true)
  assert.equal(session.token.value, '')
  assert.equal(storage.has('anglers-index.session'), false)
  assert.equal(session.sessionError.value, '')
})
