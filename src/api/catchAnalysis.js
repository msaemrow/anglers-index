import { request, ApiError } from './client.js'

export async function getCatchAnalysis(token, signal) {
  const catches = []
  let after = 0
  do {
    const data = await request(`/fishcatch/analysis?after=${after}`, { token, signal })
    if (
      !Array.isArray(data.catches) ||
      data.catches.some((fish) => !fish?.id) ||
      (data.next !== null && (!Number.isSafeInteger(data.next) || data.next <= after))
    )
      throw new ApiError('The API returned unexpected analysis data.', 200)
    catches.push(...data.catches)
    after = data.next
  } while (after !== null)
  return catches
}
