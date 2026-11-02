import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mockApi } from './helpers/mockApi.js'
import {
  getLocationPreference,
  saveLocationPreference,
  getCatchLocation,
  saveCatchLocation,
} from '../src/api/catchLocations.js'
import { createFishCatch } from '../src/api/fishCatch.js'
import { currentPosition, manualLocation, isCurrentCatch } from '../src/utils/geolocation.js'

const location = {
  latitude: 42,
  longitude: -93,
  source: 'manual',
  accuracy_meters: null,
  captured_at: null,
}

test('location and preferences requests use authentication and explicit owner endpoints', async (t) => {
  const signal = new AbortController().signal
  const calls = []
  mockApi(t, async (url, options) => {
    calls.push([url, options.method, options.body ? JSON.parse(options.body) : null])
    assert.equal(options.headers.Authorization, 'Bearer session')
    assert.equal(options.signal, signal)
    return Response.json(
      url.includes('preferences')
        ? { capture_catch_location: true }
        : { location: options.method === 'DELETE' ? null : location },
    )
  })
  assert.equal((await getLocationPreference('session', signal)).capture_catch_location, true)
  await saveLocationPreference(false, 'session', signal)
  assert.deepEqual(await getCatchLocation(17, 'session', signal), location)
  assert.deepEqual(await saveCatchLocation(17, location, 'session', signal), location)
  assert.equal(await saveCatchLocation(17, null, 'session', signal), null)
  assert.deepEqual(calls, [
    ['/api/users/me/preferences', 'GET', null],
    ['/api/users/me/preferences', 'PATCH', { capture_catch_location: false }],
    ['/api/fishcatch/17/location', 'GET', null],
    ['/api/fishcatch/17/location', 'PUT', { location }],
    ['/api/fishcatch/17/location', 'DELETE', null],
  ])
})

test('creates catches with optional location in JSON and photo multipart payloads', async (t) => {
  const fields = {
    species_id: 1,
    lake_id: 2,
    lure_id: 3,
    length: 0,
    weight: 0,
    datetime: '2026-10-31T10:30',
    location,
  }
  let count = 0
  mockApi(t, async (_, options) => {
    if (count++ === 0) assert.deepEqual(JSON.parse(options.body).location, location)
    else if (count === 2) assert.deepEqual(JSON.parse(options.body.get('location')), location)
    else assert.equal(JSON.parse(options.body).location, undefined)
    return Response.json({ id: 17 })
  })
  await createFishCatch(fields, 'session')
  const photo = new Blob(['test'], { type: 'image/jpeg' })
  photo.name = 'fish.jpg'
  await createFishCatch({ ...fields, photo }, 'session')
  await createFishCatch({ ...fields, location: null }, 'session')
})

test('device capture requests one fresh high-accuracy fix and stores accuracy and capture time', async () => {
  const timestamp = Date.now()
  const result = await currentPosition({
    secure: true,
    geolocation: {
      getCurrentPosition(success, _, options) {
        assert.deepEqual(options, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 })
        success({ coords: { latitude: 0, longitude: 0, accuracy: 20 }, timestamp })
      },
    },
  })
  assert.deepEqual(result, {
    latitude: 0,
    longitude: 0,
    accuracy_meters: 20,
    captured_at: new Date(timestamp).toISOString(),
    source: 'device',
  })
})

test('device capture reports denied permission, unavailable location, timeout and insecure context', async () => {
  await assert.rejects(currentPosition({ secure: false }), /HTTPS/)
  await assert.rejects(currentPosition({ secure: true, geolocation: null }), /unavailable/)
  for (const [code, expected] of [
    [1, /permission is denied/],
    [2, /could not determine/],
    [3, /too long/],
  ]) {
    await assert.rejects(
      currentPosition({
        secure: true,
        geolocation: {
          getCurrentPosition(_, error) {
            error({ code })
          },
        },
      }),
      expected,
    )
  }
  await assert.rejects(
    currentPosition({
      secure: true,
      geolocation: {
        getCurrentPosition(success) {
          success({ coords: { latitude: 91, longitude: 0, accuracy: 1 }, timestamp: Date.now() })
        },
      },
    }),
    /usable location/,
  )
})

test('cancellation ignores late device responses and an already aborted request never prompts', async () => {
  const controller = new AbortController()
  let success
  let calls = 0
  const geolocation = {
    getCurrentPosition(callback) {
      calls++
      success = callback
    },
  }
  const pending = currentPosition({ secure: true, geolocation, signal: controller.signal })
  controller.abort()
  await assert.rejects(pending, (error) => error.name === 'AbortError')
  success({ coords: { latitude: 42, longitude: -93, accuracy: 1 }, timestamp: Date.now() })
  await assert.rejects(
    currentPosition({ secure: true, geolocation, signal: controller.signal }),
    (error) => error.name === 'AbortError',
  )
  assert.equal(calls, 1)
})

test('backdated catches require an explicit device action; manual points have no fabricated accuracy', () => {
  const now = new Date(2026, 9, 31, 12, 0).getTime()
  assert.equal(isCurrentCatch('2026-10-31T12:00', now), true)
  assert.equal(isCurrentCatch('2026-10-30T12:00', now), false)
  assert.equal(isCurrentCatch('invalid', now), false)
  assert.equal(manualLocation('', '-93'), null)
  assert.equal(manualLocation('91', '-93'), null)
  assert.equal(manualLocation('42', '-181'), null)
  assert.deepEqual(manualLocation('0', '0'), {
    latitude: 0,
    longitude: 0,
    source: 'manual',
    captured_at: null,
    accuracy_meters: null,
  })
})

test('malformed successful reads cannot turn an existing location into an empty editor', async (t) => {
  const mock = mockApi(t, async () => Response.json({}))
  await assert.rejects(getCatchLocation(17, 'session'), /unexpected catch location/)
  await assert.rejects(getLocationPreference('session'), /unexpected location preference/)
  mock.mock.mockImplementation(async () =>
    Response.json({ location: { ...location, latitude: 91 } }),
  )
  await assert.rejects(getCatchLocation(17, 'session'), /unexpected catch location/)
})
