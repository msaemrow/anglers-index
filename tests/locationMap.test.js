import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse, compileScript } from '@vue/compiler-sfc'
import { createRenderer, computed, ref, watch, nextTick } from 'vue'
import {
  catchFeatures,
  accuracyFeature,
  catchBounds,
  catchesAtPoint,
} from '../src/utils/catchMap.js'

const { descriptor } = parse(
  readFileSync(new URL('../src/components/maps/LocationMap.vue', import.meta.url), 'utf8'),
)
const source = compileScript(descriptor, { id: 'map-test' })
  .content.replace(/^import .* from .*$/gm, '')
  .replace('import.meta.env.VITE_MAPBOX_ACCESS_TOKEN?.trim()', "'test-public-token'")
  .replace("import('mapbox-gl/esm')", 'Promise.resolve(mapboxModule)')
  .replace("import('mapbox-gl/dist/mapbox-gl.css')", 'Promise.resolve({})')
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
const fish = (id) => ({ id, latitude: 42.123456, longitude: -93.123456 })
async function mount(t, points = [fish(17), fish(18)]) {
  let instance
  class Map {
    constructor() {
      instance = this
      this.events = {}
      this.sources = {}
      this.layers = []
      this.canvas = { style: {} }
    }
    addControl() {}
    on(event, layer, handler) {
      this.events[typeof layer === 'function' ? event : `${event}:${layer}`] =
        typeof layer === 'function' ? layer : handler
    }
    addSource(id, options) {
      this.sources[id] = {
        ...options,
        setData(data) {
          this.data = data
        },
        getClusterLeaves(...args) {
          this.leaves = args.at(-1)
        },
        getClusterExpansionZoom(...args) {
          this.expansion = args.at(-1)
        },
      }
    }
    getSource(id) {
      return this.sources[id]
    }
    addLayer(layer) {
      this.layers.push(layer)
    }
    getCanvas() {
      return this.canvas
    }
    fitBounds(bounds) {
      this.bounds = bounds
    }
    jumpTo() {}
    easeTo(options) {
      this.camera = options
    }
    resize() {}
    remove() {
      this.removed = true
    }
  }
  const mapbox = { Map, NavigationControl: class {} }
  const Observer = class {
    observe() {}
    disconnect() {}
  }
  const component = new Function(
    'computed',
    'ref',
    'watch',
    'catchFeatures',
    'accuracyFeature',
    'catchBounds',
    'catchesAtPoint',
    'MapPin',
    'AppButton',
    'mapboxModule',
    'ResizeObserver',
    source,
  )(
    computed,
    ref,
    watch,
    catchFeatures,
    accuracyFeature,
    catchBounds,
    catchesAtPoint,
    {},
    {},
    mapbox,
    Observer,
  )
  let state
  const setup = component.setup
  component.setup = (props, context) => {
    state = setup(props, context)
    return state
  }
  component.render = () => null
  const selections = []
  const app = renderer.createApp(component, { points, onSelect: (ids) => selections.push(ids) })
  const vm = app.mount({})
  let mounted = true
  const unmount = () => {
    if (mounted) {
      app.unmount()
      mounted = false
    }
  }
  t.after(unmount)
  state.container.value = {}
  await nextTick()
  await nextTick()
  instance.events.load()
  return { instance, state, props: vm.$.props, selections, unmount }
}

test('map layers cluster catches and select all coincident catches using IDs, not rounded tile geometry', async (t) => {
  const { instance, selections } = await mount(t)
  assert.equal(instance.sources.catches.cluster, true)
  assert.ok(instance.layers.find((layer) => layer.id === 'cluster-count'))
  instance.events['click:catch-points']({
    features: [{ properties: { catch_id: 17 }, geometry: { coordinates: [-93.1234, 42.1234] } }],
  })
  assert.deepEqual(selections, [[17, 18]])
})
test('cluster selection opens catch details and zooms; stale callbacks after filtering are ignored', async (t) => {
  const { instance, props, selections } = await mount(t)
  const event = {
    features: [
      { properties: { cluster_id: 1, point_count: 2 }, geometry: { coordinates: [-93, 42] } },
    ],
  }
  instance.events['click:clusters'](event)
  instance.sources.catches.leaves(null, [
    { properties: { catch_id: 17 } },
    { properties: { catch_id: 18 } },
  ])
  instance.sources.catches.expansion(null, 16)
  assert.deepEqual(selections, [[17, 18]])
  assert.equal(instance.camera.zoom, 16)
  instance.events['click:clusters'](event)
  const late = instance.sources.catches.leaves
  props.points = [fish(99)]
  await nextTick()
  late(null, [{ properties: { catch_id: 17 } }])
  assert.equal(selections.length, 1)
  assert.equal(instance.sources.catches.data.features[0].properties.catch_id, 99)
})
test('unmount removes the map and ignores outstanding cluster responses', async (t) => {
  const { instance, selections, unmount } = await mount(t)
  instance.events['click:clusters']({
    features: [
      { properties: { cluster_id: 1, point_count: 2 }, geometry: { coordinates: [-93, 42] } },
    ],
  })
  const late = instance.sources.catches.leaves
  unmount()
  late(null, [{ properties: { catch_id: 17 } }])
  assert.equal(instance.removed, true)
  assert.equal(selections.length, 0)
})
