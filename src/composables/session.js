// Claims are only used for presentation. The API verifies the token and permissions.
export function decodeSession(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(payload), (character) => character.charCodeAt(0))
    const user = JSON.parse(new TextDecoder().decode(bytes))
    if (
      !user.user_id ||
      !user.username ||
      !Number.isFinite(user.exp) ||
      user.exp * 1000 <= Date.now()
    )
      return null
    return user
  } catch {
    return null
  }
}
