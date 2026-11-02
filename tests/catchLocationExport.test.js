import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse, compileScript } from '@vue/compiler-sfc'
import { createRenderer, computed, ref, watch, onBeforeUnmount, nextTick } from 'vue'
const { descriptor } = parse(
  readFileSync(
    new URL('../src/components/catches/CatchLocationExport.vue', import.meta.url),
    'utf8',
  ),
)
const source = compileScript(descriptor, { id: 'export-test' })
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
function mount(t) {
  const requests = []
  const downloads = []
  const urls = []
  const doc = {
    createElement: () => ({
      click() {
        downloads.push(this.download)
      },
      remove() {},
    }),
    body: { appendChild() {} },
  }
  const url = {
    createObjectURL: () => {
      urls.push('created')
      return 'blob:test'
    },
    revokeObjectURL: () => urls.push('revoked'),
  }
  const component = new Function(
    'computed',
    'ref',
    'watch',
    'onBeforeUnmount',
    'getLakes',
    'exportCatchGpx',
    'AppButton',
    'AppSelect',
    'document',
    'URL',
    'setTimeout',
    source,
  )(
    computed,
    ref,
    watch,
    onBeforeUnmount,
    async () => [],
    (filters, token, signal) =>
      new Promise((resolve, reject) => {
        requests.push({ filters, token, signal, resolve, reject })
      }),
    {},
    {},
    doc,
    url,
    (callback) => callback(),
  )
  let state
  const setup = component.setup
  component.setup = (props, context) => {
    state = setup(props, context)
    return state
  }
  component.render = () => null
  const app = renderer.createApp(component, { token: 'session' })
  app.mount({})
  t.after(() => app.unmount())
  return { state, requests, downloads, urls }
}
test('export reports skipped catches and avoids downloading an empty file', async (t) => {
  const exportForm = mount(t)
  await nextTick()
  const pending = exportForm.state.download()
  assert.equal(exportForm.state.busy.value, true)
  exportForm.requests[0].resolve({ exported: 0, skipped: 4 })
  await pending
  assert.equal(exportForm.downloads.length, 0)
  assert.match(exportForm.state.notice.value, /No locations to export. 4 catches/)
  assert.equal(exportForm.state.busy.value, false)
})
test('export downloads the file and reports export/skip counts with current filters', async (t) => {
  const exportForm = mount(t)
  await nextTick()
  exportForm.state.lakeId.value = 2
  exportForm.state.from.value = '2026-11-01'
  await nextTick()
  const pending = exportForm.state.download()
  assert.equal(exportForm.requests[0].filters.lake_id, 2)
  assert.equal(exportForm.requests[0].filters.from, '2026-11-01')
  assert.equal(exportForm.requests[0].token, 'session')
  exportForm.requests[0].resolve({
    exported: 3,
    skipped: 2,
    blob: new Blob(['gpx']),
    filename: 'anglers-index-catches.gpx',
  })
  await pending
  assert.deepEqual(exportForm.downloads, ['anglers-index-catches.gpx'])
  assert.deepEqual(exportForm.urls, ['created', 'revoked'])
  assert.match(exportForm.state.notice.value, /3 catch locations exported. 2 catches skipped/)
})
test('invalid date ranges do not submit and failed exports preserve filters for retry', async (t) => {
  const exportForm = mount(t)
  await nextTick()
  exportForm.state.from.value = '2026-11-02'
  exportForm.state.to.value = '2026-11-01'
  await exportForm.state.download()
  assert.equal(exportForm.requests.length, 0)
  exportForm.state.to.value = ''
  await nextTick()
  const pending = exportForm.state.download()
  exportForm.requests[0].reject(new Error('Please retry'))
  await pending
  assert.equal(exportForm.state.from.value, '2026-11-02')
  assert.equal(exportForm.state.error.value, 'Please retry')
  assert.equal(exportForm.downloads.length, 0)
})
