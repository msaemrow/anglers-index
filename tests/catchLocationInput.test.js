import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse, compileScript } from '@vue/compiler-sfc'
import { createRenderer, computed, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { isCurrentCatch } from '../src/utils/geolocation.js'
import { localDateTime } from '../src/api/fishCatch.js'

// Mount the actual script with a small host renderer; device fixes remain controllable.
const { descriptor } = parse(
  readFileSync(
    new URL('../src/components/catches/CatchLocationInput.vue', import.meta.url),
    'utf8',
  ),
)
const source = compileScript(descriptor, { id: 'location-test' })
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
function mount(t, props = {}) {
  const fixes = []
  const component = new Function(
    'computed',
    'onBeforeUnmount',
    'ref',
    'watch',
    'currentPosition',
    'isCurrentCatch',
    source,
  )(
    computed,
    onBeforeUnmount,
    ref,
    watch,
    (options) =>
      new Promise((resolve, reject) => {
        fixes.push({ resolve, reject, signal: options.signal })
        options.signal.addEventListener('abort', () =>
          reject(new DOMException('Cancelled', 'AbortError')),
        )
      }),
    isCurrentCatch,
  )
  let state
  const setup = component.setup
  component.setup = (props, context) => {
    state = setup(props, context)
    return state
  }
  component.render = () => null
  let vm
  const app = renderer.createApp(component, {
    datetime: localDateTime(),
    ...props,
    'onUpdate:modelValue': (value) => {
      vm.$.props.modelValue = value
    },
  })
  vm = app.mount({})
  let mounted = true
  const unmount = () => {
    if (mounted) {
      app.unmount()
      mounted = false
    }
  }
  t.after(unmount)
  return { state, fixes, props: vm.$.props, unmount }
}
const point = {
  latitude: 42,
  longitude: -93,
  accuracy_meters: 10,
  source: 'device',
  captured_at: new Date().toISOString(),
}

test('capture is opt-in and backdated catches do not request current location', async (t) => {
  assert.equal(mount(t).fixes.length, 0)
  const current = mount(t, { defaultEnabled: true })
  assert.equal(current.fixes.length, 1)
  current.fixes[0].resolve(point)
  await nextTick()
  assert.equal(current.props.modelValue.latitude, 42)
  const older = mount(t, { defaultEnabled: true, datetime: '2020-01-01T12:00' })
  assert.equal(older.fixes.length, 0)
  older.state.enabled.value = true
  older.state.toggle()
  assert.equal(older.fixes.length, 0)
})

test('late fixes cannot restore location after opt-out, save or unmount', async (t) => {
  for (const action of ['off', 'save', 'unmount']) {
    const mounted = mount(t, { defaultEnabled: true })
    const fix = mounted.fixes[0]
    if (action === 'off') {
      mounted.state.enabled.value = false
      mounted.state.toggle()
    }
    if (action === 'save') {
      mounted.props.disabled = true
      await nextTick()
    }
    if (action === 'unmount') mounted.unmount()
    assert.equal(fix.signal.aborted, true)
    fix.resolve(point)
    await nextTick()
    assert.equal(mounted.props.modelValue?.source === 'device', false)
  }
})

test('changing catch time clears device positions while failures leave saving available', async (t) => {
  const existing = mount(t, { modelValue: point })
  existing.props.datetime = '2020-01-01T12:00'
  await nextTick()
  assert.equal(existing.props.modelValue, null)
  const failed = mount(t)
  failed.state.enabled.value = true
  const pending = failed.state.locate()
  failed.fixes[0].reject(new Error('Location unavailable'))
  await pending
  assert.match(failed.state.message.value, /unavailable/)
  assert.equal(failed.state.locating.value, false)
  assert.equal(failed.props.modelValue, null)
})
