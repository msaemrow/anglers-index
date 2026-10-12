import { AxiosError } from 'axios'
import { apiClient } from '../../src/api/client.js'

// Keep endpoint tests focused on their existing URL, headers, and body assertions.
export function mockApi(t, handler) {
  const transport = { send: handler }
  const mock = t.mock.method(transport, 'send', handler)
  const original = apiClient.defaults.adapter
  apiClient.defaults.adapter = async (config) => {
    const result = await transport.send(apiClient.getUri(config), {
      method: config.method.toUpperCase(),
      signal: config.signal,
      headers: config.headers.toJSON(),
      body: config.data,
    })
    const response = {
      status: result.status,
      statusText: result.statusText,
      headers: Object.fromEntries(result.headers),
      config,
      data: config.responseType === 'blob' ? await result.blob() : await result.text(),
    }
    if (response.status < 200 || response.status >= 300)
      throw new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, null, response)
    return response
  }
  t.after(() => {
    apiClient.defaults.adapter = original
  })
  return mock
}
