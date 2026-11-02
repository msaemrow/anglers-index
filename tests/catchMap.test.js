import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mockApi } from './helpers/mockApi.js'
import { getLakeCatchLocations, getCatchLocations } from '../src/api/catchLocations.js'
import {
  catchFeatures,
  accuracyFeature,
  catchBounds,
  catchesAtPoint,
  filterMapCatches,
} from '../src/utils/catchMap.js'

const fish = (id, patch = {}) => ({
  id,
  latitude: 42,
  longitude: -93,
  species_id: 3,
  species_name: 'Bass',
  date: '2026-10-31',
  ...patch,
})
test('loads all lightweight map pages with authentication, lake scoping and cancellation', async (t) => {
  const signal = new AbortController().signal
  let calls = 0
  mockApi(t, async (url, options) => {
    assert.equal(
      url,
      calls++ === 0
        ? '/api/fishcatch/locations?lake_id=2'
        : '/api/fishcatch/locations?lake_id=2&after=17',
    )
    assert.equal(options.headers.Authorization, 'Bearer session')
    assert.equal(options.signal, signal)
    return Response.json(
      calls === 1
        ? { catches: [fish(17)], next_cursor: 17 }
        : { catches: [fish(20)], next_cursor: null },
    )
  })
  assert.deepEqual(
    (await getLakeCatchLocations(2, 'session', signal)).map((item) => item.id),
    [17, 20],
  )
})
test('rejects malformed map pages and failed pagination rather than displaying partial data', async (t) => {
  const mock = mockApi(t, async () => Response.json({}))
  for (const data of [
    {},
    { catches: [fish(17)], next_cursor: 9 },
    { catches: [fish(17, { latitude: 91 })], next_cursor: null },
  ]) {
    mock.mock.mockImplementation(async () => Response.json(data))
    await assert.rejects(getLakeCatchLocations(2, 'session'), /unexpected catch map/)
  }
  let count = 0
  mock.mock.mockImplementation(async () =>
    ++count === 1
      ? Response.json({ catches: [fish(17)], next_cursor: 17 })
      : Response.json({ error: 'Try later' }, { status: 429 }),
  )
  await assert.rejects(getLakeCatchLocations(2, 'session'), (error) => error.status === 429)
})
test('date and species filters are inclusive and never substitute lake coordinates for missing catch locations', () => {
  const catches = [
    fish(1, { date: '2026-10-30' }),
    fish(2),
    fish(3, { species_id: 5 }),
    fish(4, { date: null }),
  ]
  assert.deepEqual(
    filterMapCatches(catches, { species: '3', from: '2026-10-30', to: '2026-10-31' }).map(
      (item) => item.id,
    ),
    [1, 2],
  )
  const features = catchFeatures([fish(1, { witness: '<script>' })])
  assert.deepEqual(features.features[0].properties, { catch_id: 1 })
  assert.deepEqual(features.features[0].geometry.coordinates, [-93, 42])
  assert.equal(catchFeatures([]).features.length, 0)
})
test('accuracy circles use reported meters and never imply accuracy for manual coordinates', () => {
  const point = fish(1, { source: 'device', accuracy_meters: 100 })
  const polygon = accuracyFeature(point).features[0].geometry
  assert.equal(polygon.type, 'Polygon')
  assert.equal(polygon.coordinates[0].length, 65)
  assert.deepEqual(polygon.coordinates[0][0], polygon.coordinates[0].at(-1))
  const [lon, lat] = polygon.coordinates[0][0]
  assert.ok(Math.abs((((lat - point.latitude) * Math.PI) / 180) * 6371008.8 - 100) < 0.01)
  assert.ok(Math.abs(lon - point.longitude) < 0.000001)
  assert.equal(accuracyFeature({ ...point, source: 'manual' }).features.length, 0)
  assert.equal(accuracyFeature(null).features.length, 0)
})
test('coincident catches remain individually selectable and bounds handle the date line', () => {
  assert.deepEqual(
    catchesAtPoint([fish(1), fish(2), fish(3, { latitude: 43 })], [-93, 42]).map((item) => item.id),
    [1, 2],
  )
  assert.deepEqual(catchBounds([fish(1)]), [
    [-93, 42],
    [-93, 42],
  ])
  const bounds = catchBounds([fish(1, { longitude: 179.9 }), fish(2, { longitude: -179.9 })])
  assert.ok(bounds[1][0] - bounds[0][0] < 0.21)
  assert.equal(catchBounds([]), null)
})

test('waypoints load all lakes through cursor pages without per-catch requests', async (t) => {
  let calls = 0
  mockApi(t, async (url, options) => {
    assert.equal(options.headers.Authorization, 'Bearer session')
    assert.equal(
      url,
      calls++ === 0 ? '/api/fishcatch/locations?' : '/api/fishcatch/locations?after=17',
    )
    return Response.json(
      calls === 1
        ? { catches: [fish(17)], next_cursor: 17 }
        : { catches: [fish(20)], next_cursor: null },
    )
  })
  assert.deepEqual(
    (await getCatchLocations('session')).map((item) => item.id),
    [17, 20],
  )
})
test('waypoint filters combine lake, species and inclusive dates', () => {
  const records = [
    fish(1, { lake_id: 2 }),
    fish(2, { lake_id: 4 }),
    fish(3, { lake_id: 2, species_id: 5 }),
    fish(4, { lake_id: 2, date: null }),
  ]
  assert.deepEqual(
    filterMapCatches(records, {
      lake: '2',
      species: '3',
      from: '2026-10-31',
      to: '2026-10-31',
    }).map((item) => item.id),
    [1],
  )
})
