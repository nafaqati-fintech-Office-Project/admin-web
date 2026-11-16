import { useState } from 'react'
import { confirmEmailChange, deletionAction, listDeletions, listEmailChanges } from '../services/adminApi.js'
import { Async, Badge, Page, PrivacyNote, Table, fmtDate, useLoad } from '../components/ui.jsx'

function useAction(reload) {
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')
  const run = async (id, label, fn) => {
    if (!window.confirm(`${label} request ${id}? This is recorded in the audit log.`)) return
    setBusy(id)
    setError('')
    try {
      await fn()
      reload()
    } catch (e) {
      setError(e.response?.data?.message ?? 'The action failed.')
    } finally {
      setBusy(null)
    }
  }
  return { busy, error, run }
}

export function EmailChanges() {
  const state = useLoad(listEmailChanges)
  const { busy, error, run } = useAction(state.reload)
  const columns = [
    { key: 'id', label: 'Request', render: (r) => <code>{r.id}</code> },
    { key: 'userRef', label: 'Account ref', render: (r) => <code>{r.userRef}</code> },
    { key: 'newEmailMasked', label: 'Requested (masked)' },
    { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
    { key: 'createdAt', label: 'Created', render: (r) => fmtDate(r.createdAt) },
    {
      key: 'a', label: '', render: (r) => r.status === 'PENDING_VERIFICATION' && (
        <button className="btn small btn-primary" disabled={busy === r.id} onClick={() => run(r.id, 'Confirm', () => confirmEmailChange(r.id))}>Confirm</button>
      ),
    },
  ]
  return (
    <Page title="Email change requests" subtitle="Confirm email changes after the identity check done outside this panel">
      <PrivacyNote>Emails are masked. Confirming never reveals the full address to the operator.</PrivacyNote>
      {error && <div className="form-error">{error}</div>}
      <Async state={state}>{(rows) => <Table columns={columns} rows={rows} />}</Async>
    </Page>
  )
}

export function Deletions() {
  const state = useLoad(listDeletions)
  const { busy, error, run } = useAction(state.reload)
  const open = (s) => ['REQUESTED', 'PENDING', 'GRACE_PERIOD', 'PROCESSING'].includes(s)
  const columns = [
    { key: 'id', label: 'Request', render: (r) => <code>{r.id}</code> },
    { key: 'userRef', label: 'Account ref', render: (r) => <code>{r.userRef}</code> },
    { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
    { key: 'createdAt', label: 'Requested', render: (r) => fmtDate(r.createdAt) },
    { key: 'graceEndsAt', label: 'Purge after (grace period ends)', render: (r) => fmtDate(r.graceEndsAt) },
    {
      key: 'a', label: '', render: (r) => open(r.status) && (
        <div className="row-actions">
          {r.status !== 'PROCESSING' && <button className="btn small btn-outline" disabled={busy === r.id} onClick={() => run(r.id, 'Process', () => deletionAction(r.id, 'process'))}>Process</button>}
          {r.status === 'PROCESSING' && <button className="btn small btn-primary" disabled={busy === r.id} onClick={() => run(r.id, 'Complete', () => deletionAction(r.id, 'complete'))}>Complete</button>}
          <button className="btn small btn-danger-outline" disabled={busy === r.id} onClick={() => run(r.id, 'Cancel', () => deletionAction(r.id, 'cancel'))}>Cancel</button>
        </div>
      ),
    },
  ]
  return (
    <Page title="Account deletion requests" subtitle="Right-to-erasure workflow. Completing a request publishes the user-deleted event to every service.">
      <PrivacyNote>Only the request state is shown. The data being erased is never visible here.</PrivacyNote>
      {error && <div className="form-error">{error}</div>}
      <Async state={state}>{(rows) => <Table columns={columns} rows={rows} />}</Async>
    </Page>
  )
}
