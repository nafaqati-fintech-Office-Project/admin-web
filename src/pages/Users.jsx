import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { changePlan, deleteAccount, endSubscription, findAccount, forceLogout, getCapabilities, listUsers, setUserStatus } from '../services/adminApi.js'
import { shortId } from '../lib/privacy.js'
import { useAuth } from '../lib/auth.jsx'
import { Async, Badge, Card, Notice, Page, PrivacyNote, Table, fmtDay, useLoad } from '../components/ui.jsx'

const PAGE = 25
const STATUSES = ['ALL', 'ACTIVE', 'PENDING_DELETION', 'DELETED']

const planLabel = (u) => {
  if (u.plan == null) return '—'
  if (u.plan !== 'PREMIUM') return <Badge value="FREE" />
  return (
    <span className="plan-cell">
      <Badge value="PREMIUM" />
      {u.cancelAtPeriodEnd && <span className="muted small">ends {fmtDay(u.periodEnd)}</span>}
    </span>
  )
}

export default function Users() {
  const caps = useLoad(getCapabilities)
  const [q, setQ] = useState('')
  const [ref, setRef] = useState('')
  const [status, setStatus] = useState('ALL')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState(null)
  const [flash, setFlash] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [finding, setFinding] = useState(false)
  const [findError, setFindError] = useState('')

  // Exact lookup for a support request: the full e-mail or username the person gave. The panel never keeps or shows it.
  const find = async (e) => {
    e.preventDefault()
    setFinding(true)
    setFindError('')
    try {
      const account = await findAccount(identifier.trim())
      setIdentifier('')
      setSelected(account)
    } catch (err) {
      setFindError(err.response?.data?.message ?? 'The lookup failed.')
    } finally {
      setFinding(false)
    }
  }

  // The search is sent after a short pause, so each keystroke does not query three services.
  useEffect(() => {
    const t = setTimeout(() => { setRef(q.trim().toLowerCase()); setPage(0) }, 300)
    return () => clearTimeout(t)
  }, [q])

  const load = useCallback(() => listUsers({ page, size: PAGE, ref, status }), [page, ref, status])
  const state = useLoad(load)

  const total = state.data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE))
  const sources = state.data?.sources

  const columns = [
    { key: 'id', label: 'Account ref', render: (u) => <code>{shortId(u.id)}</code> },
    {
      key: 'status', label: 'Status', render: (u) => (
        <span className="plan-cell"><Badge value={u.status} />{u.suspended && <Badge value="SUSPENDED" />}{u.admin && <Badge value="ADMIN" />}</span>
      ),
    },
    { key: 'plan', label: 'Plan', render: planLabel },
    { key: 'authProvider', label: 'Sign-in', render: (u) => (u.authProvider === 'GOOGLE' ? 'Google' : u.authProvider === 'PASSWORD' ? 'Password' : '—') },
    { key: 'createdAt', label: 'Joined', render: (u) => fmtDay(u.createdAt) },
    {
      key: 'actions', label: '', render: (u) => (
        <div className="row-actions">
          <button className="btn small btn-outline" disabled={u.status === 'DELETED'} onClick={() => setSelected(u)}>Manage</button>
        </div>
      ),
    },
  ]

  return (
    <Page title="Accounts" subtitle="For support and abuse handling. No names, contact details or financial data.">
      <PrivacyNote>Accounts are identified by a pseudonymous reference only. The panel never lists e-mail addresses, names or phone numbers: to find the account behind a support request, enter the person's full e-mail address or username below. Only an exact match opens an account, and every lookup is recorded in the audit log.</PrivacyNote>
      <Card title="Find an account from a support request">
        <form className="find-form" onSubmit={find}>
          <input type="text" value={identifier} onChange={(e) => { setIdentifier(e.target.value); setFindError('') }}
            placeholder="Full e-mail address or username" aria-label="Full e-mail address or username" autoComplete="off" spellCheck={false} />
          <button className="btn btn-primary" disabled={finding || identifier.trim().length < 3}>{finding ? 'Finding…' : 'Find account'}</button>
        </form>
        {findError && <div className="form-error find-error" role="alert">{findError}</div>}
        <p className="muted small">Exact match only: partial addresses and wildcards are refused. Check the masked e-mail in the account window before you act.</p>
      </Card>
      {sources && !sources.auth && <Notice>auth-service did not answer: suspended state and sign-in method are not shown, and access actions may fail.</Notice>}
      {sources && !sources.billing && <Notice>billing-service did not answer: plans are not shown.</Notice>}
      {flash && <div className="notice ok" role="status">{flash}</div>}
      <div className="toolbar">
        <input placeholder="Filter by account ref…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search by account ref" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0) }} aria-label="Filter by status">
          {STATUSES.map((s) => <option key={s} value={s}>{s === 'ALL' ? 'All statuses' : s.replaceAll('_', ' ')}</option>)}
        </select>
        <span className="muted">{total.toLocaleString()} accounts</span>
      </div>
      <Async state={state}>
        {(d) => (
          <>
            <Table columns={columns} rows={d.items} empty="No accounts match." />
            <div className="pager">
              <button className="btn small btn-outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
              <span>Page {page + 1} of {pages}</span>
              <button className="btn small btn-outline" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </>
        )}
      </Async>
      {selected && (
        <ManageAccount
          account={selected}
          caps={caps.data ?? {}}
          onClose={() => setSelected(null)}
          onDone={(message) => { setSelected(null); setFlash(message); state.reload() }}
        />
      )}
    </Page>
  )
}

function ManageAccount({ account: u, caps, onClose, onDone }) {
  const { session } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const ref = shortId(u.id)
  const own = session?.id === u.id
  const pendingDeletion = u.status === 'PENDING_DELETION'

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const act = async (fn, message) => {
    setBusy(true)
    setError('')
    try {
      await fn()
      onDone(message)
    } catch (e) {
      setError(e.response?.data?.message ?? 'The action failed.')
      setBusy(false)
    }
  }
  const ask = (text, fn, message) => { if (window.confirm(text)) act(fn, message) }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="manage-title">
        <header>
          <h2 id="manage-title">Account <code>{ref}</code>{u.emailMasked && u.emailMasked !== '-' && <span className="masked-email" title="Masked e-mail: compare it with the support request">{u.emailMasked}</span>}</h2>
          <button className="icon-btn" onClick={onClose} disabled={busy} aria-label="Close"><X size={18} /></button>
        </header>
        <p className="muted small">
          {u.status.replaceAll('_', ' ').toLowerCase()}{u.suspended ? ', suspended' : ''} · {u.plan === 'PREMIUM' ? 'Premium' : 'Free'} · joined {fmtDay(u.createdAt)}
        </p>
        {own && <Notice>This is your own account. You cannot suspend it, delete it or change its plan here.</Notice>}
        {u.admin && !own && <Notice>This is an admin account. It cannot be suspended or deleted from the panel.</Notice>}
        {error && <div className="form-error" role="alert">{error}</div>}

        <section>
          <h3>Access</h3>
          <p className="muted small">Signed-in devices keep working for up to 15 minutes, until their current access token expires.</p>
          <div className="row-actions start">
            {caps.accountStatus && !own && !u.admin && (u.suspended
              ? <button className="btn small btn-outline" disabled={busy} onClick={() => ask(`Reactivate account ${ref}? The person can sign in again.`, () => setUserStatus(u.id, 'ACTIVE'), `Account ${ref} reactivated.`)}>Reactivate</button>
              : <button className="btn small btn-danger-outline" disabled={busy} onClick={() => ask(`Suspend account ${ref}? The person is signed out everywhere and cannot sign in until reactivated.`, () => setUserStatus(u.id, 'SUSPENDED'), `Account ${ref} suspended.`)}>Suspend</button>)}
            {caps.forceLogout && (
              <button className="btn small btn-outline" disabled={busy} onClick={() => ask(`Sign account ${ref} out of all devices?`, () => forceLogout(u.id), `Account ${ref} signed out of all devices.`)}>Force logout</button>
            )}
          </div>
        </section>

        {!own && u.plan === 'PREMIUM' && (caps.endSubscription || caps.changePlan) && (
          <section>
            <h3>Plan: Premium</h3>
            <p className="muted small">
              {u.cancelAtPeriodEnd ? `Not renewing: Premium ends on ${fmtDay(u.periodEnd)}.` : `Renews on ${fmtDay(u.periodEnd)}.`} No refund is made from here.
            </p>
            <div className="row-actions start">
              {caps.endSubscription && !u.cancelAtPeriodEnd && (
                <button className="btn small btn-outline" disabled={busy} onClick={() => ask(`Stop renewal for ${ref}? Premium stays until ${fmtDay(u.periodEnd)}.`, () => endSubscription(u.id, 'PERIOD_END'), `Subscription of ${ref} will end on ${fmtDay(u.periodEnd)}.`)}>End at period end</button>
              )}
              <button className="btn small btn-danger-outline" disabled={busy} onClick={() => ask(`Downgrade ${ref} to Free now? Premium ends immediately.`, () => changePlan(u.id, 'FREE'), `Account ${ref} is now on Free.`)}>Downgrade to Free now</button>
            </div>
          </section>
        )}

        {!own && u.plan === 'FREE' && caps.changePlan && u.status === 'ACTIVE' && (
          <section>
            <h3>Plan: Free</h3>
            <p className="muted small">Complimentary Premium: nobody is charged, and it ends on its own after the period (it is not renewed).</p>
            <div className="row-actions start">
              <button className="btn small btn-outline" disabled={busy} onClick={() => ask(`Give ${ref} Premium for 1 month, free of charge?`, () => changePlan(u.id, 'PREMIUM', 'MONTHLY'), `Account ${ref} has Premium for 1 month.`)}>Upgrade to Premium · 1 month</button>
              <button className="btn small btn-outline" disabled={busy} onClick={() => ask(`Give ${ref} Premium for 1 year, free of charge?`, () => changePlan(u.id, 'PREMIUM', 'YEARLY'), `Account ${ref} has Premium for 1 year.`)}>Upgrade to Premium · 1 year</button>
            </div>
          </section>
        )}

        {caps.deleteAccount && !own && !u.admin && (
          <section className="danger-zone">
            <h3>Delete account</h3>
            {!pendingDeletion && (
              <>
                <p className="muted small">Scheduled: the account is closed with the normal grace period, so the person can still restore it. Premium is not renewed.</p>
                <div className="row-actions start">
                  <button className="btn small btn-outline" disabled={busy} onClick={() => ask(`Schedule deletion of ${ref}? It is erased when the grace period ends unless the person restores it.`, () => deleteAccount(u.id, false), `Deletion of ${ref} scheduled.`)}>Schedule deletion</button>
                </div>
              </>
            )}
            <p className="muted small">Delete now: Premium ends and the account and its data are erased in every service. <strong>This cannot be undone.</strong></p>
            <label className="confirm-label">Type <code>{ref}</code> to confirm
              <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" spellCheck={false} />
            </label>
            <div className="row-actions start">
              <button className="btn small btn-danger" disabled={busy || confirmText.trim().toLowerCase() !== ref} onClick={() => act(() => deleteAccount(u.id, true), `Account ${ref} deleted.`)}>
                {busy ? 'Working…' : 'Delete now'}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
