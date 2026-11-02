import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse, compileScript } from '@vue/compiler-sfc'
import { createRenderer, computed, ref, watch, nextTick } from 'vue'
import { lakeCoordinates } from '../src/api/lakes.js'

const { descriptor } = parse(
  readFileSync(new URL('../src/components/maps/CoordinatePicker.vue', import.meta.url), 'utf8'),
)
const source = compileScript(descriptor, { id: 'picker-test' })
  .content.replace(/^import .* from .*$/gm, '')
  .replace('import.meta.env.VITE_MAPBOX_ACCESS_TOKEN?.trim()', "'public-test-token'")
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
async function settle() {
  for (let i = 0; i < 5; i++) await nextTick()
}
async function mount(t, props = {}) {
  const maps = []
  const fixes = []
  const selections = []
  class Map {
    constructor(options) {
      this.options = options
      this.events = {}
      maps.push(this)
    }
    addControl() {}
    getCanvas() {
      return { style: {} }
    }
    on(event, callback) {
      this.events[event] = callback
    }
    resize() {}
    remove() {}
    getBounds() {
      return { contains: () => true }
    }
  }
  class Marker {
    setLngLat() {
      return this
    }
    addTo() {
      return this
    }
    getElement() {
      return { setAttribute() {} }
    }
    on() {}
    remove() {}
    setDraggable() {}
  }
  const module = { Map, Marker, NavigationControl: class {}, GeolocateControl: class {} }
  const Observer = class {
    observe() {}
    disconnect() {}
  }
  const component = new Function(
    'computed',
    'ref',
    'watch',
    'lakeCoordinates',
    'currentPosition',
    'LABELS',
    'EVENTS',
    'AppButton',
    'mapboxModule',
    'ResizeObserver',
    source,
  )(
    computed,
    ref,
    watch,
    lakeCoordinates,
    (options) =>
      new Promise((resolve, reject) => {
        fixes.push({ resolve, reject, signal: options.signal })
        options.signal.addEventListener('abort', () =>
          reject(new DOMException('Cancelled', 'AbortError')),
        )
      }),
    {},
    { SELECT: 'select' },
    {},
    module,
    Observer,
  )
  let state
  const setup = component.setup
  component.setup = (props, context) => {
    state = setup(props, context)
    return state
  }
  component.render = () => null
  const app = renderer.createApp(component, {
    useDeviceLocation: true,
    fallbackCoordinates: [-94, 43],
    ...props,
    onSelect: (point) => selections.push(point),
  })
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
  await settle()
  return { maps, fixes, selections, state, props: vm.$.props, unmount }
}

test('a saved catch position takes priority without requesting device location', async (t) => {
  const picker = await mount(t, { latitude: 42, longitude: -93 })
  assert.equal(picker.fixes.length, 0)
  assert.deepEqual(picker.maps[0].options.center, [-93, 42])
  assert.equal(picker.selections.length, 0)
})
test('without a catch position, device coordinates center the map without selecting or saving a catch position', async (t) => {
  const picker = await mount(t)
  assert.equal(picker.fixes.length, 1)
  picker.fixes[0].resolve({ latitude: 41, longitude: -92 })
  await settle()
  assert.deepEqual(picker.maps[0].options.center, [-92, 41])
  assert.equal(picker.selections.length, 0)
  assert.equal(picker.state.coordinates.value, null)
})
test('denied or unavailable device location falls back to the associated lake', async (t) => {
  for (const reason of ['Permission denied', 'Location unavailable']) {
    const picker = await mount(t)
    picker.fixes[0].reject(new Error(reason))
    await settle()
    assert.deepEqual(picker.maps[0].options.center, [-94, 43])
    assert.equal(picker.selections.length, 0)
  }
})
test('manual coordinates override a pending device request, and unmount ignores late responses', async (t) => {
  const picker = await mount(t)
  picker.props.latitude = 40
  picker.props.longitude = -91
  await settle()
  assert.equal(picker.fixes[0].signal.aborted, true)
  picker.fixes[0].resolve({ latitude: 41, longitude: -92 })
  await settle()
  assert.deepEqual(picker.maps[0].options.center, [-91, 40])
  const closed = await mount(t)
  closed.unmount()
  assert.equal(closed.fixes[0].signal.aborted, true)
  closed.fixes[0].resolve({ latitude: 41, longitude: -92 })
  await settle()
  assert.equal(closed.maps.length, 0)
})
