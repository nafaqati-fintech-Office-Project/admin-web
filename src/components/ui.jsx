import { useCallback, useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'

/** Loads data once and exposes reload. */
export function useLoad(fn) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true }))
    fn().then(
      (data) => setState({ data, error: null, loading: false }),
      (error) => setState({ data: null, error, loading: false }),
    )
  }, [fn])
  useEffect(() => {
    load()
  }, [load])
  return { ...state, reload: load }
}

export function Page({ title, subtitle, actions, children }) {
  return (
    <section className="page">
      <header className="page-head">
        <div>
          <h1>{title}</h1>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        {actions}
      </header>
      {children}
    </section>
  )
}

export function Async({ state, children }) {
  if (state.loading && !state.data) return <div className="state">Loading…</div>
  if (state.error) return <div className="state error">Could not load this data. {state.error.message}</div>
  return children(state.data)
}

export function Card({ title, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {title && <h3>{title}</h3>}
      {children}
    </div>
  )
}

export function Stat({ label, value, delta }) {
  const missing = value == null || value === 'null'
  return (
    <div className="card stat">
      <span className="muted">{label}</span>
      <strong>{missing ? '—' : value}</strong>
      {missing && <span className="muted">Not connected yet</span>}
      {!missing && delta != null && <span className={delta >= 0 ? 'pos' : 'neg'}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}% vs previous 30 days</span>}
    </div>
  )
}

const TONES = {
  ACTIVE: 'ok', UP: 'ok', SENT: 'ok', SUCCESS: 'ok', CONFIRMED: 'ok', COMPLETED: 'ok', PREMIUM: 'brand',
  PENDING: 'warn', GRACE_PERIOD: 'warn', PROCESSING: 'warn', TRIAL: 'warn', REQUESTED: 'warn', PENDING_VERIFICATION: 'warn',
  QUEUED: 'warn', PENDING_DELETION: 'warn', DELETED: 'bad',
  SUSPENDED: 'bad', DOWN: 'bad', DENIED: 'bad', FAILED: 'bad', CANCELLED: 'muted', FREE: 'muted',
}
export const Badge = ({ value }) => <span className={`badge ${TONES[value] ?? 'muted'}`}>{String(value).replaceAll('_', ' ')}</span>

export function Table({ columns, rows, empty = 'Nothing to show.' }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={columns.length} className="muted center">{empty}</td></tr>}
          {rows.map((r, i) => (
            <tr key={r.id ?? i}>
              {columns.map((c) => <td key={c.key}>{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const Notice = ({ children }) => <div className="notice">{children}</div>

export const NotAvailable = ({ children = 'Not available yet' }) => <div className="state small">{children}</div>

export const PrivacyNote = ({ children }) => (
  <div className="privacy-note">
    <ShieldCheck size={16} />
    <span>{children ?? 'Privacy by design: this panel shows account metadata and aggregates only. Names, contact details, transactions, balances and merchants are never loaded or displayed.'}</span>
  </div>
)

export const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—')
export const fmtDay = (iso) => (iso ? new Date(iso).toLocaleDateString([], { dateStyle: 'medium' }) : '—')
