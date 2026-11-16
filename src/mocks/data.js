// Fixture data for development (VITE_USE_MOCKS=true). It has the SAME shape as admin-service returns, including what is not
// connected yet (null totals, empty series): pseudonymous ids, states, dates and counts. No personal or financial content.
const day = 86400000
const iso = (offset) => new Date(Date.now() - offset * day).toISOString()
const hex = (n) => (0x1a2b3c4d + n * 7919).toString(16).padEnd(8, '0') + '-0000-4000-8000-000000000000'

export const users = Array.from({ length: 42 }, (_, i) => ({
  id: hex(i),
  status: i % 9 === 4 ? 'PENDING_DELETION' : 'ACTIVE',
  createdAt: iso(i * 2 + 1),
}))

const ref = (i) => users[i].id.slice(0, 8)

export const emailChangeRequests = [
  { id: 'a1b2c3d4-0001', userRef: ref(3), newEmailMasked: 'd***@o***.com', status: 'PENDING_VERIFICATION', createdAt: iso(0.2) },
  { id: 'a1b2c3d4-0002', userRef: ref(8), newEmailMasked: 'k***@g***.com', status: 'PENDING_VERIFICATION', createdAt: iso(1.4) },
  { id: 'a1b2c3d4-0003', userRef: ref(15), newEmailMasked: 'p***@g***.com', status: 'CONFIRMED', createdAt: iso(5) },
]

export const deletionRequests = [
  { id: 'b1b2c3d4-0001', userRef: ref(5), status: 'REQUESTED', createdAt: iso(3), graceEndsAt: iso(-27) },
  { id: 'b1b2c3d4-0002', userRef: ref(11), status: 'REQUESTED', createdAt: iso(0.5), graceEndsAt: iso(-29.5) },
  { id: 'b1b2c3d4-0003', userRef: ref(19), status: 'PROCESSING', createdAt: iso(31), graceEndsAt: iso(1) },
  { id: 'b1b2c3d4-0004', userRef: ref(27), status: 'COMPLETED', createdAt: iso(40), graceEndsAt: iso(10) },
  { id: 'b1b2c3d4-0005', userRef: ref(30), status: 'CANCELLED', createdAt: iso(12), graceEndsAt: iso(-18) },
]

const series = (n, base, amp) =>
  Array.from({ length: n }, (_, i) => ({
    date: new Date(Date.now() - (n - 1 - i) * day).toISOString().slice(5, 10),
    value: Math.round(base + Math.sin(i / 3) * amp + i * 1.5),
  }))

export const overview = {
  totals: { users: 12840, activeUsers30d: null, premium: 1184, families: null },
  deltas: { users: 4.2, activeUsers30d: null, premium: null, families: null },
  signups: series(30, 60, 18),
  dailyActive: [],
  planBreakdown: [{ label: 'Free', count: 11656 }, { label: 'Premium', count: 1184 }],
  platformBreakdown: [],
  featureAdoption: [],
  sources: { users: true, billing: true },
}

export const billing = {
  totals: { activeSubscriptions: 1184, pastDue: 21, churn30d: 3.4, failedPayments7d: 17 },
  byPlan: [{ label: 'Premium monthly', count: 812 }, { label: 'Premium yearly', count: 372 }],
  byProvider: [{ label: 'paymob', count: 640 }],
  growthIndex: [],
  available: true,
}

export const capabilities = {
  accountStatus: false,
  forceLogout: false,
  kafkaLag: false,
  broadcastDelivery: false,
  featureFlagsEnforced: false,
}

const svc = (service, port, up = true, ms = 20) => ({ service, port, status: up ? 'UP' : 'DOWN', latencyMs: up ? ms : null })
export const health = [
  svc('admin-service', 8088, true, 0),
  svc('api-gateway', 8080, true, 12),
  svc('auth-service', 8081, true, 18),
  svc('user-service', 8082, true, 22),
  svc('transaction-service', 8083, true, 31),
  svc('notification-service', 8084, true, 15),
  svc('family-service', 8086, true, 19),
  svc('reports-analytics-service', 8089, true, 44),
  svc('budget-service', 8090, true, 21),
  svc('subscription-service', 8091, false),
  svc('goal-service', 8092, true, 16),
  svc('billing-service', 8093, true, 25),
]

export const kafka = []

export const featureFlags = [
  { key: 'family-premium-enforcement', summary: 'Enforce Premium for Family features', enabled: false },
  { key: 'sms-import', summary: 'SMS transaction import', enabled: true },
  { key: 'paymob-checkout', summary: 'Paymob checkout in the apps', enabled: true },
]

export const broadcasts = [
  { id: 'bc-1', title: 'Welcome to Family budgets', audience: 'All users', channel: 'PUSH', status: 'QUEUED', sentAt: iso(6), reach: 0 },
]

export const auditLog = [
  { id: 4, at: iso(0.05), actor: 'c872cc7a', action: 'DELETION_REQUEST_PROCESS', target: 'b1b2c3d4-0003', outcome: 'SUCCESS' },
  { id: 3, at: iso(1.1), actor: 'c872cc7a', action: 'EMAIL_CHANGE_CONFIRM', target: 'a1b2c3d4-0003', outcome: 'SUCCESS' },
  { id: 2, at: iso(2.2), actor: 'c872cc7a', action: 'FEATURE_FLAG_SET', target: 'sms-import', outcome: 'SUCCESS' },
  { id: 1, at: iso(3.0), actor: '9f31a2be', action: 'DELETION_REQUEST_CANCEL', target: 'b1b2c3d4-0005', outcome: 'DENIED' },
]
