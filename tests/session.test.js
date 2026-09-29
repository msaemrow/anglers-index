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
