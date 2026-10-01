import test from 'node:test'
import assert from 'node:assert/strict'
import { summarizeCatches } from '../src/utils/catchSummary.js'

test('counts and ranks catches by species, breaking ties by label', () => {
  const catches = [
    { species_id: 1, species: { name: 'Walleye' } },
    { species_id: 2, species: { name: 'Bass' } },
    { species_id: '1', species: { name: 'Walleye' } },
    { species_id: 3, species: { name: 'Perch' } },
  ]
  assert.deepEqual(
    summarizeCatches(catches, 'species').map(({ label, count }) => [label, count]),
    [
      ['Walleye', 2],
      ['Bass', 1],
      ['Perch', 1],
    ],
  )
})
test('keeps lakes with the same name and different IDs separate', () => {
  const result = summarizeCatches(
    [
      { lake_id: 1, lake: { name: 'Clear', county: 'A' } },
      { lake_id: 2, lake: { name: 'Clear', county: 'B' } },
    ],
    'lake',
  )
  assert.equal(result.length, 2)
  assert.deepEqual(
    result.map((row) => row.label),
    ['Clear · A', 'Clear · B'],
  )
})
test('uses only lure names and preserves catches with missing relations', () => {
  const result = summarizeCatches(
    [
      { lure: { id: 1, brand: 'Acme', name: 'Spoon', color: 'Gold', size: 'Small' } },
      { lure_id: 2 },
      {},
      {},
    ],
    'lure',
  )
  assert.equal(
    result.reduce((sum, row) => sum + row.count, 0),
    4,
  )
  assert.equal(result[0].label, 'Not recorded')
  assert.equal(result.find((row) => row.label === 'Spoon').tooltip, 'Acme · Spoon · Gold · Small')
  assert.ok(result.some((row) => row.label === 'Lure #2'))
})
test('handles an empty history or unsupported grouping', () => {
  assert.deepEqual(summarizeCatches([], 'species'), [])
  assert.deepEqual(summarizeCatches([{}], 'wind'), [])
})
