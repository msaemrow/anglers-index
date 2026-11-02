// A single fresh fix; never watches or tracks the user in the background.
export function currentPosition({
  geolocation = globalThis.navigator?.geolocation,
  secure = globalThis.isSecureContext,
  signal,
} = {}) {
  return new Promise((resolve, reject) => {
    if (!secure)
      return reject(
        new Error(
          'Device location requires HTTPS. You can enter coordinates or save without a location.',
        ),
      )
    if (!geolocation)
      return reject(
        new Error(
          'Device location is unavailable. You can enter coordinates or save without a location.',
        ),
      )
    let finished = false
    let timer
    function finish(error, value) {
      if (finished) return
      finished = true
      clearTimeout(timer)
      signal?.removeEventListener('abort', abort)
      if (error) reject(error)
      else resolve(value)
    }
    function abort() {
      finish(new DOMException('Location request cancelled', 'AbortError'))
    }
    if (signal?.aborted) return abort()
    signal?.addEventListener('abort', abort, { once: true })
    timer = setTimeout(
      () => finish(new Error('Location took too long. Retry or save without a location.')),
      20000,
    )
    try {
      geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords
          if (
            ![latitude, longitude, accuracy, position.timestamp].every(Number.isFinite) ||
            Math.abs(latitude) > 90 ||
            Math.abs(longitude) > 180 ||
            accuracy < 0
          )
            return finish(
              new Error('A usable location was not available. Retry or save without a location.'),
            )
          finish(null, {
            latitude,
            longitude,
            accuracy_meters: accuracy,
            captured_at: new Date(position.timestamp).toISOString(),
            source: 'device',
          })
        },
        (error) => {
          const messages = {
            1: 'Location permission is denied. Allow it in browser/site settings, enter coordinates, or save without a location.',
            2: 'Your device could not determine its location. Retry, enter coordinates, or save without a location.',
            3: 'Location took too long. Retry or save without a location.',
          }
          finish(
            new Error(messages[error.code] || 'Location is unavailable. You can save without it.'),
          )
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
      )
    } catch {
      finish(new Error('Location is unavailable. You can save without it.'))
    }
  })
}

export function isCurrentCatch(datetime, now = Date.now()) {
  const timestamp = new Date(datetime).getTime()
  return Number.isFinite(timestamp) && Math.abs(timestamp - now) <= 15 * 60 * 1000
}

export function manualLocation(latitude, longitude) {
  if (String(latitude).trim() === '' || String(longitude).trim() === '') return null
  const lat = Number(latitude)
  const lon = Number(longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180)
    return null
  return {
    latitude: lat,
    longitude: lon,
    accuracy_meters: null,
    captured_at: null,
    source: 'manual',
  }
}
