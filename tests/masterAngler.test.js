import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getMasterAnglerCertificate } from '../src/api/masterAngler.js'

test('requests a PDF for the catch using the mounted API route and bearer token', async (t) => {
  const signal = new AbortController().signal
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/masterangler/42/certificate')
    assert.equal(options.method, 'POST')
    assert.equal(options.headers.Authorization, 'Bearer session')
    assert.equal(options.headers.Accept, 'application/pdf')
    assert.equal(options.signal, signal)
    return new Response('%PDF-1.7\ncertificate', { headers: { 'Content-Type': 'application/pdf' } })
  })
  const pdf = await getMasterAnglerCertificate(42, 'session', signal)
  assert.equal(pdf.type, 'application/pdf')
  assert.ok((await pdf.text()).startsWith('%PDF-'))
})

test('preserves certificate errors instead of downloading them as PDFs', async (t) => {
  const mock = t.mock.method(
    globalThis,
    'fetch',
    async () => new Response('{"error":"Awaiting approval"}', { status: 403 }),
  )
  await assert.rejects(
    getMasterAnglerCertificate(42, 'session'),
    (error) => error.status === 403 && error.message === 'Awaiting approval',
  )
  mock.mock.mockImplementation(
    async () => new Response('{"error":"Session expired"}', { status: 401 }),
  )
  await assert.rejects(getMasterAnglerCertificate(42, 'session'), (error) => error.status === 401)
  mock.mock.mockImplementation(
    async () => new Response('{}', { headers: { 'Content-Type': 'application/json' } }),
  )
  await assert.rejects(getMasterAnglerCertificate(42, 'session'), /did not return a PDF/)
  mock.mock.mockImplementation(
    async () => new Response('', { headers: { 'Content-Type': 'application/pdf' } }),
  )
  await assert.rejects(getMasterAnglerCertificate(42, 'session'), /invalid PDF/)
})
