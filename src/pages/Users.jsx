import { useMemo, useState } from 'react'
import { forceLogout, getCapabilities, listUsers, setUserStatus } from '../services/adminApi.js'
import { shortId } from '../lib/privacy.js'
import { Async, Badge, Notice, Page, PrivacyNote, Table, fmtDay, useLoad } from '../components/ui.jsx'

const PAGE = 15

export default function Users() {
  const state = useLoad(listUsers)
  const caps = useLoad(getCapabilities)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('ALL')
  const [page, setPage] = useState(0)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')

  const canStatus = caps.data?.accountStatus
  const canLogout = caps.data?.forceLogout

  const act = async (fn, id) => {
    setBusy(id)
    setError('')
    try {
      await fn()
      state.reload()
    } catch (e) {
      setError(e.response?.data?.message ?? 'The action failed.')
    } finally {
      setBusy(null)
    }
  }

  const columns = [
    { key: 'id', label: 'Account ref', render: (u) => <code>{shortId(u.id)}</code> },
    { key: 'status', label: 'Status', render: (u) => <Badge value={u.status} /> },
    { key: 'createdAt', label: 'Joined', render: (u) => fmtDay(u.createdAt) },
    ...(canStatus || canLogout ? [{
      key: 'actions', label: '', render: (u) => (
        <div className="row-actions">
          {canStatus && (
            <button className="btn small btn-outline" disabled={busy === u.id} onClick={() => {
              const next = u.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED'
              if (window.confirm(`${next === 'SUSPENDED' ? 'Suspend' : 'Reactivate'} account ${shortId(u.id)}?`)) act(() => setUserStatus(u.id, next), u.id)
            }}>{u.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}</button>
          )}
          {canLogout && (
            <button className="btn small btn-outline" disabled={busy === u.id} onClick={() => {
              if (window.confirm(`Sign account ${shortId(u.id)} out of all devices?`)) act(() => forceLogout(u.id), u.id)
            }}>Force logout</button>
          )}
        </div>
      ),
    }] : []),
  ]

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return (state.data ?? []).filter((u) =>
      (status === 'ALL' || u.status === status) && (!term || u.id.toLowerCase().startsWith(term)))
  }, [state.data, q, status])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const current = Math.min(page, pages - 1)
  const rows = filtered.slice(current * PAGE, (current + 1) * PAGE)

  return (
    <Page title="Accounts" subtitle="The newest accounts, for support and abuse handling. No names, contact details or financial data.">
      <PrivacyNote>Accounts are identified by a pseudonymous reference only. This panel does not receive e-mail addresses, names or phone numbers. Search by the first characters of the account ref.</PrivacyNote>
      {caps.data && !canStatus && <Notice>Suspending an account and forcing a sign-out are not available yet: auth-service has no admin API for them.</Notice>}
      {error && <div className="form-error">{error}</div>}
      <div className="toolbar">
        <input placeholder="Search by account ref…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0) }}>
          <option value="ALL">All statuses</option><option>ACTIVE</option><option>PENDING_DELETION</option><option>DELETED</option>
        </select>
        <span className="muted">{filtered.length} accounts</span>
      </div>
      <Async state={state}>
        {() => (
          <>
            <Table columns={columns} rows={rows} empty="No accounts match." />
            <div className="pager">
              <button className="btn small btn-outline" disabled={current === 0} onClick={() => setPage(current - 1)}>Previous</button>
              <span>Page {current + 1} of {pages}</span>
              <button className="btn small btn-outline" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>Next</button>
            </div>
          </>
        )}
      </Async>
    </Page>
  )
}
