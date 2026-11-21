// Fixture data only in local development, and only when VITE_USE_MOCKS is not "false". A production build (Vercel) always
// talks to the real API, so a missing variable can never make the live panel show invented data.
export const USE_MOCKS = import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS !== 'false'

// Production: the public API (see .env.production). Local development: '' = same origin, through the Vite /api proxy.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
