// Reads claims from the access token for UI decisions only; the server enforces roles on every request.
export function decodeClaims(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(decodeURIComponent(escape(atob(payload))))
  } catch {
    return {}
  }
}

export function hasAdminRole(claims) {
  const roles = [].concat(claims.roles ?? claims.role ?? claims.authorities ?? [])
  return roles.some((r) => String(r).replace(/^ROLE_/, '').toUpperCase() === 'ADMIN')
}
