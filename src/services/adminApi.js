import http from '../lib/http.js'
import { USE_MOCKS } from '../lib/config.js'
import { sanitize } from '../lib/privacy.js'
import * as m from '../mocks/data.js'

// Every response passes through sanitize(): forbidden personal/financial fields are dropped client-side
// even if a backend change ever leaks them.
const wait = (v) => new Promise((r) => setTimeout(() => r(structuredClone(v)), 150))
const get = async (path, mock) => sanitize(USE_MOCKS ? await wait(mock) : (await http.get(path)).data)
const post = async (path, body, mock) =>
  sanitize(USE_MOCKS ? await wait(mock ?? { ok: true }) : (await http.post(path, body)).data)

// ---- What this deployment can do yet (admin-service) ----
export const getCapabilities = () => get('/api/admin/capabilities', m.capabilities)

// ---- Aggregates (admin-service) ----
export const getOverview = () => get('/api/admin/stats/overview', m.overview)
export const getBilling = () => get('/api/admin/stats/billing', m.billing)

// ---- Accounts: metadata only ----
export const listUsers = () => get('/api/admin/users', m.users)
export const setUserStatus = (id, status) => post(`/api/admin/users/${id}/status`, { status })
export const forceLogout = (id) => post(`/api/admin/users/${id}/force-logout`)

// ---- Request queues (the POST actions already exist in user-service) ----
export const listEmailChanges = () => get('/api/admin/email-change-requests', m.emailChangeRequests)
export const confirmEmailChange = (id) => post(`/api/admin/email-change-requests/${id}/confirm`)
export const listDeletions = () => get('/api/admin/deletion-requests', m.deletionRequests)
export const deletionAction = (id, action) => post(`/api/admin/deletion-requests/${id}/${action}`) // process | complete | cancel

// ---- Operations ----
export const getHealth = () => get('/api/admin/system/health', m.health)
export const getKafka = () => get('/api/admin/system/kafka', m.kafka)
export const getFlags = () => get('/api/admin/feature-flags', m.featureFlags)
export const setFlag = (key, enabled) => post(`/api/admin/feature-flags/${key}`, { enabled })

// ---- Notifications ----
export const listBroadcasts = () => get('/api/admin/broadcasts', m.broadcasts)
export const sendBroadcast = (payload) => post('/api/admin/broadcasts', payload)

// ---- Audit ----
export const getAudit = () => get('/api/admin/audit', m.auditLog)
