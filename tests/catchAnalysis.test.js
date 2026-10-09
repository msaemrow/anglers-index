import test from 'node:test'
import assert from 'node:assert/strict'
import { catchGroup, groupCatches } from '../src/utils/catchAnalysis.js'
test('numeric groups preserve zero and negatives and separate missing values', () => {
  assert.equal(catchGroup({ temperature: 0 }, 'temperature').key, '0')
  assert.equal(catchGroup({ temperature: -1 }, 'temperature').key, '-10')
  for (const value of [null, undefined, '', ' ', 'bad'])
    assert.equal(catchGroup({ temperature: value }, 'temperature').key, 'missing')
  assert.equal(catchGroup({ barometric: 30.2 }, 'barometric').key, '30.2')
  assert.equal(catchGroup({ wind_speed: 5 }, 'wind_speed').key, '5')
})
test('uses recorded local dates and times and rejects malformed dates', () => {
  assert.equal(catchGroup({ date: '2026-02-30' }, 'month').key, 'missing')
  assert.equal(catchGroup({ date: '2026-01-01' }, 'month').key, '0')
  assert.equal(catchGroup({ time: '06:00:00' }, 'time').key, '1')
  assert.equal(catchGroup({ time: '23:59:00' }, 'time').key, '3')
  assert.equal(catchGroup({ time: '24:00:00' }, 'time').key, 'missing')
})
test('groups all catches, counts distinct dates, and retains missing records', () => {
  const rows = groupCatches(
    [{ date: '2025-01-01' }, { date: '2025-01-01' }, { date: '2026-01-01' }, {}],
    'month',
  )
  assert.equal(rows[0].count, 3)
  assert.equal(rows[0].days, 2)
  assert.equal(rows[1].key, 'missing')
  assert.equal(
    rows.reduce((sum, row) => sum + row.count, 0),
    4,
  )
  assert.deepEqual(groupCatches([], 'month'), [])
})
