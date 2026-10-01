import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getSpecies, addSpecies } from '../src/api/species.js'

test('loads personal bests for only the signed-in user with authentication and cancellation', async (t) => {
  const signal = new AbortController().signal
  const data = [
    {
      id: 1,
      name: 'Bass',
      caught: true,
      personalBest: { catchId: 8, length: 20, date: '2026-09-01' },
      approved_master_angler: true,
    },
  ]
  const mock = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/species?includeCaughtSpecies=true&userId=42')
    assert.equal(options.headers.Authorization, 'Bearer session')
    assert.equal(options.signal, signal)
    return Response.json(data)
  })
  assert.deepEqual(await getSpecies(42, 'session', signal), data)
  await assert.rejects(getSpecies(null, 'session'), /Sign in/)
  assert.equal(mock.mock.callCount(), 1)
})

test('distinguishes an empty species directory, malformed data, and expired sessions', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async () => Response.json([]))
  assert.deepEqual(await getSpecies(42), [])
  for (const data of [{}, [{ name: 'Bass' }]]) {
    mock.mock.mockImplementation(async () => Response.json(data))
    await assert.rejects(getSpecies(42), /unexpected species list/)
  }
  mock.mock.mockImplementation(async () => Response.json({ error: 'Expired' }, { status: 401 }))
  await assert.rejects(getSpecies(42), (error) => error.status === 401)
})

test('validates new species before posting and preserves duplicate-name errors', async (t) => {
  const signal = new AbortController().signal
  const mock = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/species')
    assert.equal(options.method, 'POST')
    assert.equal(options.headers.Authorization, 'Bearer admin')
    assert.equal(options.signal, signal)
    assert.deepEqual(JSON.parse(options.body), { name: 'Bass', master_angler_length: 20.5 })
    return Response.json({ id: 1, name: 'Bass', master_angler_length: 20.5 }, { status: 201 })
  })
  for (const length of ['', null, undefined, -1, 0, 'invalid', Infinity])
    await assert.rejects(
      addSpecies({ name: 'Bass', master_angler_length: length }, 'admin'),
      (error) => error.status === 400,
    )
  await assert.rejects(addSpecies({ name: ' ', master_angler_length: 20 }, 'admin'))
  assert.equal(mock.mock.callCount(), 0)
  assert.equal(
    (await addSpecies({ name: ' Bass ', master_angler_length: '20.5' }, 'admin', signal)).id,
    1,
  )
  mock.mock.mockImplementation(async () =>
    Response.json({ error: 'Fish species already exists' }, { status: 400 }),
  )
  await assert.rejects(
    addSpecies({ name: 'Bass', master_angler_length: 20.5 }, 'admin'),
    /already exists/,
  )
})
