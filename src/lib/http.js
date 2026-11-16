import axios from 'axios'
import { API_BASE_URL } from './config.js'

// Admin sessions are deliberately short: the access token lives in memory only and the refresh token in
// sessionStorage (cleared when the tab closes). Nothing admin-related is ever written to localStorage.
const REFRESH_KEY = 'admin_refresh_token'
let accessToken = null

export const setAccessToken = (t) => { accessToken = t }
export const getAccessToken = () => accessToken
export const readRefresh = () => { try { return sessionStorage.getItem(REFRESH_KEY) } catch { return null } }
export const writeRefresh = (t) => { try { sessionStorage.setItem(REFRESH_KEY, t) } catch { /* ignore */ } }
export const clearSession = () => {
  accessToken = null
  try { sessionStorage.removeItem(REFRESH_KEY) } catch { /* ignore */ }
}

export const FORCED_LOGOUT = 'admin:forced-logout'

export const bare = axios.create({ baseURL: API_BASE_URL })
const http = axios.create({ baseURL: API_BASE_URL })

http.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

let refreshing = null
http.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && original && !original._retried && readRefresh()) {
      original._retried = true
      refreshing ??= bare.post('/api/auth/refresh', { refreshToken: readRefresh() })
        .then((r) => { writeRefresh(r.data.refreshToken); setAccessToken(r.data.accessToken) })
        .finally(() => { refreshing = null })
      try {
        await refreshing
        return http(original)
      } catch { /* fall through to logout */ }
    }
    if (err.response?.status === 401) {
      clearSession()
      window.dispatchEvent(new Event(FORCED_LOGOUT))
    }
    return Promise.reject(err)
  },
)

export default http
