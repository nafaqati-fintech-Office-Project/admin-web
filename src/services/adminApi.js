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
// Fetched once per page load and reused by every screen (it only changes when admin-service is redeployed).
let capabilities = null
export const getCapabilities = () => {
  if (!capabilities) capabilities = get('/api/admin/capabilities', m.capabilities).catch((e) => { capabilities = null; throw e })
  return capabilities
}

// ---- Aggregates (admin-service) ----
export const getOverview = () => get('/api/admin/stats/overview', m.overview)
export const getBilling = () => get('/api/admin/stats/billing', m.billing)

// ---- Accounts: metadata only ----
export const listUsers = ({ page = 0, size = 25, ref = '', status = 'ALL' } = {}) => {
  if (USE_MOCKS) return get('', m.usersPage({ page, size, ref, status }))
  const params = new URLSearchParams({ page, size })
  if (ref) params.set('ref', ref)
  if (status && status !== 'ALL') params.set('status', status)
  return get(`/api/admin/users?${params}`)
}
// Exact support lookup (full e-mail or username, sent in the body, never in the URL). Answers with one account row.
export const findAccount = (identifier) => post('/api/admin/users/lookup', { identifier }, m.lookup(identifier))
export const setUserStatus = (id, status) => post(`/api/admin/users/${id}/status`, { status }) // SUSPENDED | ACTIVE
export const forceLogout = (id) => post(`/api/admin/users/${id}/force-logout`)
export const deleteAccount = (id, immediate) => post(`/api/admin/users/${id}/delete`, { immediate })
export const endSubscription = (id, mode) => post(`/api/admin/users/${id}/subscription/end`, { mode }) // PERIOD_END | NOW
export const changePlan = (id, plan, interval) => post(`/api/admin/users/${id}/plan`, { plan, interval }) // PREMIUM (MONTHLY | YEARLY) | FREE

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
