const legacyBase = (import.meta.env?.VITE_LEGACY_APP_URL || 'http://localhost:3000').replace(
  /\/+$/,
  '',
)

export function legacyUrl(path) {
  return `${legacyBase}/${path.replace(/^\/+/, '')}`
}
