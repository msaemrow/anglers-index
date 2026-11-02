import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mockApi } from './helpers/mockApi.js'
import { exportCatchGpx } from '../src/api/catchExport.js'
const gpx =
  '<?xml version="1.0"?><gpx version="1.1" creator="Anglers Index" xmlns="http://www.topografix.com/GPX/1/1"></gpx>'
const headers = {
  'Content-Type': 'application/gpx+xml; charset=utf-8',
  'X-Export-Count': '2',
  'X-Skipped-Count': '3',
}

test('downloads a GPX blob with authenticated lake/date filters, optional details and counts', async (t) => {
  const signal = new AbortController().signal
  mockApi(t, async (url, options) => {
    const parsed = new URL(url, 'http://localhost')
    assert.equal(parsed.pathname, '/api/fishcatch/export/gpx')
    assert.equal(parsed.searchParams.get('lake_id'), '2')
    assert.equal(parsed.searchParams.get('species_id'), '3')
    assert.equal(parsed.searchParams.get('from'), '2026-11-01')
    assert.equal(parsed.searchParams.get('to'), '2026-11-02')
    assert.equal(parsed.searchParams.get('details'), 'false')
    assert.equal(options.headers.Authorization, 'Bearer session')
    assert.equal(options.headers.Accept, 'application/gpx+xml')
    assert.equal(options.signal, signal)
    return new Response(gpx, { headers })
  })
  const result = await exportCatchGpx(
    { lake_id: 2, species_id: 3, from: '2026-11-01', to: '2026-11-02', details: false },
    'session',
    signal,
  )
  assert.equal(await result.blob.text(), gpx)
  assert.equal(result.exported, 2)
  assert.equal(result.skipped, 3)
  assert.equal(result.filename, 'anglers-index-catches.gpx')
})
test('all-catch export omits blank filters and invalid ranges never make a request', async (t) => {
  let calls = 0
  mockApi(t, async (url) => {
    calls++
    assert.equal(url, '/api/fishcatch/export/gpx?details=true')
    return new Response(gpx, { headers: { ...headers, 'X-Export-Count': '0' } })
  })
  assert.equal((await exportCatchGpx({}, 'session')).exported, 0)
  await assert.rejects(
    exportCatchGpx({ from: '2026-11-02', to: '2026-11-01' }, 'session'),
    /end date/,
  )
  assert.equal(calls, 1)
})
test('GPX error responses preserve server messages; malformed responses cannot become downloads', async (t) => {
  const mock = mockApi(t, async () => Response.json({ error: 'Session expired' }, { status: 401 }))
  await assert.rejects(
    exportCatchGpx({}, 'session'),
    (error) => error.status === 401 && error.message === 'Session expired',
  )
  for (const response of [
    Response.json({}),
    new Response('<html>Oops</html>', { headers }),
    new Response(gpx, { headers: { ...headers, 'X-Export-Count': 'unknown' } }),
  ]) {
    mock.mock.mockImplementation(async () => response)
    await assert.rejects(exportCatchGpx({}, 'session'), /GPX|export counts/)
  }
})
