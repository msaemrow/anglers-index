import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRouter, createMemoryHistory } from 'vue-router'
import { requireSession } from '../src/router/auth.js'

const token = (claims) =>
  `e30.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`
const valid = token({ user_id: 42, username: 'angler', exp: Math.floor(Date.now() / 1000) + 3600 })
function storage(t, getItem) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem } })
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'localStorage', original)
    else delete globalThis.localStorage
  })
}
test('anonymous, expired and invalid sessions redirect dashboard and profile aliases home', async (t) => {
  let stored
  storage(t, () => stored)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: {} },
      {
        path: '/dashboard',
        alias: '/:username/profile',
        component: {},
        meta: { requiresAuth: true },
      },
    ],
  })
  router.beforeEach(requireSession)
  for (const value of [null, '', 'broken', token({ user_id: 42, username: 'angler', exp: 1 })]) {
    stored = value
    for (const path of ['/dashboard', '/angler/profile']) {
      await router.push(path)
      assert.equal(router.currentRoute.value.path, '/')
    }
  }
  stored = valid
  await router.push('/dashboard')
  assert.equal(router.currentRoute.value.path, '/dashboard')
})
test('public routes stay available and unavailable storage redirects protected navigation', (t) => {
  storage(t, () => {
    throw new Error('Storage unavailable')
  })
  assert.equal(requireSession({ meta: {} }), true)
  assert.deepEqual(requireSession({ meta: { requiresAuth: true } }), {
    name: 'home',
    replace: true,
  })
})
