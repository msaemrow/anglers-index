import test from 'node:test'
import assert from 'node:assert/strict'
import { getTrips, createTrip, attachTripCatch, deleteTrip } from '../src/api/trips.js'
import { createFishCatch } from '../src/api/fishCatch.js'
import { formatDate, formatTime } from '../src/utils/dateTime.js'
test('loads all trip pages with session authentication and abort signal', async (t) => {
  const signal = new AbortController().signal
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(options.headers.Authorization, 'Bearer session')
    assert.equal(options.signal, signal)
    const cursor = new URL(url, 'http://localhost').searchParams.get('after')
    return new Response(
      JSON.stringify(
        cursor === '0' ? { trips: [{ id: 1 }], next: 1 } : { trips: [{ id: 2 }], next: null },
      ),
    )
  })
  assert.deepEqual(await getTrips('session', signal), [{ id: 1 }, { id: 2 }])
})
test('rejects broken pagination instead of looping indefinitely', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('{"trips":[],"next":0}'))
  await assert.rejects(getTrips('session'), /Unexpected trip/)
})
test('trip requests send only the intended actions and catch creation preserves trip association', async (t) => {
  const requests = []
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push({ url, body: JSON.parse(options.body), method: options.method })
    return new Response('{"id":5}')
  })
  await createTrip({ lake_id: 2, start_date: '2026-01-01', single_day: true }, 'session')
  await attachTripCatch(5, 8, 'session')
  await createFishCatch(
    {
      species_id: 1,
      lake_id: 2,
      lure_id: 3,
      trip_id: '5',
      length: 0,
      weight: 0,
      datetime: '2026-01-01T11:00',
    },
    'session',
  )
  assert.equal(requests[1].url, '/api/trips/5/catches')
  assert.deepEqual(requests[1].body, { catch_id: 8 })
  assert.equal(requests[2].body.trip_id, 5)
})
test('trip displays use dd/mm/yyyy and 12-hour local clock times', () => {
  assert.equal(formatDate('2026-10-08'), '08/10/2026')
  assert.equal(formatTime('00:05:00'), '12:05 AM')
  assert.equal(formatTime('12:00:00'), '12:00 PM')
  assert.equal(formatTime('18:30:00'), '6:30 PM')
})

test('starts a trip with a catch in one request and validates its date range', async (t) => {
  const fields = {
    species_id: 1,
    lake_id: 2,
    lure_id: 3,
    length: 0,
    weight: 0,
    datetime: '2026-01-01T11:00',
    new_trip: { start_date: '2026-01-01', single_day: true },
  }
  let calls = 0
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls++
    assert.equal(url, '/api/fishcatch')
    const body = JSON.parse(options.body)
    assert.deepEqual(body.new_trip, {
      start_date: '2026-01-01',
      end_date: '2026-01-01',
      single_day: true,
    })
    assert.equal(body.trip_id, undefined)
    return new Response('{"id":7,"trip_id":55}')
  })
  assert.equal((await createFishCatch(fields, 'session')).trip_id, 55)
  await assert.rejects(
    createFishCatch(
      { ...fields, new_trip: { start_date: '2026-01-02', single_day: true } },
      'session',
    ),
    /trip dates/,
  )
  await assert.rejects(createFishCatch({ ...fields, trip_id: 8 }, 'session'), /existing trip/)
  assert.equal(calls, 1)
})

test('deletes only the selected trip with session authentication and cancellation', async (t) => {
  const signal = new AbortController().signal
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/trips/5')
    assert.equal(options.method, 'DELETE')
    assert.equal(options.headers.Authorization, 'Bearer session')
    assert.equal(options.signal, signal)
    assert.equal(options.body, undefined)
    return new Response('{"message":"Trip deleted. All catches have been kept."}')
  })
  await deleteTrip(5, 'session', signal)
})
