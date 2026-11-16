import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { USE_MOCKS } from './config.js'
import http, { FORCED_LOGOUT, bare, clearSession, setAccessToken, writeRefresh } from './http.js'
import { decodeClaims, hasAdminRole } from './jwt.js'

const AuthContext = createContext(null)
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null) // { role } only: never the person's name or email

  const login = useCallback(async (identifier, password) => {
    if (USE_MOCKS) {
      setSession({ role: 'ADMIN', mock: true })
      return
    }
    const { data } = await bare.post('/api/auth/login', { identifier, password, rememberMe: false })
    if (!hasAdminRole(decodeClaims(data.accessToken))) {
      const err = new Error('This account is not an administrator.')
      err.code = 'NOT_ADMIN'
      throw err
    }
    setAccessToken(data.accessToken)
    writeRefresh(data.refreshToken)
    setSession({ role: 'ADMIN' })
  }, [])

  const logout = useCallback(async () => {
    try {
      if (!USE_MOCKS) await http.post('/api/auth/logout', {})
    } catch {
      /* best effort */
    }
    clearSession()
    setSession(null)
  }, [])

  useEffect(() => {
    const onForced = () => setSession(null)
    window.addEventListener(FORCED_LOGOUT, onForced)
    return () => window.removeEventListener(FORCED_LOGOUT, onForced)
  }, [])

  // Idle timeout: admins are signed out after 15 minutes without interaction.
  useEffect(() => {
    if (!session) return undefined
    let timer
    const reset = () => {
      clearTimeout(timer)
      timer = setTimeout(logout, 15 * 60 * 1000)
    }
    const events = ['mousemove', 'keydown', 'click']
    events.forEach((e) => window.addEventListener(e, reset))
    reset()
    return () => {
      clearTimeout(timer)
      events.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [session, logout])

  const value = useMemo(() => ({ session, login, logout }), [session, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
