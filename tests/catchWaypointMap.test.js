import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse, compileScript } from '@vue/compiler-sfc'
import { createRenderer, computed, ref, watch, nextTick } from 'vue'
import { filterMapCatches } from '../src/utils/catchMap.js'

const { descriptor } = parse(
  readFileSync(new URL('../src/components/maps/CatchWaypointMap.vue', import.meta.url), 'utf8'),
)
const source = compileScript(descriptor, { id: 'waypoints-test' })
  .content.replace(/^import .* from .*$/gm, '')
  .replace('export default', 'return')
const renderer = createRenderer({
  createElement: () => ({}),
  createText: () => ({}),
  createComment: () => ({}),
  insert() {},
  remove() {},
  setText() {},
  setElementText() {},
  patchProp() {},
  parentNode: () => null,
  nextSibling: () => null,
})
test('shared waypoint filters update map points and export criteria without refetching', async (t) => {
  const catches = [
    { id: 1, species_id: 3, species_name: 'Bass', lake_id: 2, date: '2026-11-01' },
    { id: 2, species_id: 4, species_name: 'Pike', lake_id: 2, date: '2026-11-01' },
    { id: 3, species_id: 3, species_name: 'Bass', lake_id: 5, date: '2026-11-01' },
    { id: 4, species_id: 3, species_name: 'Bass', lake_id: 2, date: '2026-10-31' },
  ]
  let calls = 0
  const component = new Function(
    'computed',
    'ref',
    'watch',
    'getLakeCatchLocations',
    'lakeCoordinates',
    'getLakes',
    'filterMapCatches',
    'CatchLocationExport',
    'LocationMap',
    'AppButton',
    'AppSelect',
    'DataCardList',
    'CollapsibleFilters',
    source,
  )(
    computed,
    ref,
    watch,
    async (id) => {
      calls++
      assert.equal(id, undefined)
      return catches
    },
    () => null,
    async () => [],
    filterMapCatches,
    {},
    {},
    {},
    {},
    {},
    {},
  )
  let state
  const setup = component.setup
  component.setup = (props, context) => {
    state = setup(props, context)
    return state
  }
  component.render = () => null
  const app = renderer.createApp(component, { token: 'session', username: 'angler' })
  app.mount({})
  t.after(() => app.unmount())
  await new Promise((resolve) => setImmediate(resolve))
  state.select([2])
  state.species.value = '3'
  state.lakeId.value = '2'
  state.from.value = state.to.value = '2026-11-01'
  await nextTick()
  assert.deepEqual(
    state.filtered.value.map((fish) => fish.id),
    [1],
  )
  assert.deepEqual(state.exportFilters.value, {
    species_id: '3',
    lake_id: '2',
    from: '2026-11-01',
    to: '2026-11-01',
  })
  assert.equal(state.selected.value, null)
  assert.equal(calls, 1)
  state.from.value = '2026-11-02'
  await nextTick()
  assert.equal(state.invalidRange.value, true)
  assert.deepEqual(state.filtered.value, [])
  state.resetFilters()
  await nextTick()
  assert.equal(state.filtered.value.length, 4)
  assert.equal(calls, 1)
})
