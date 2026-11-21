import { useState } from 'react'
import { listBroadcasts, sendBroadcast } from '../services/adminApi.js'
import { Async, Badge, Card, Notice, Page, PrivacyNote, Table, fmtDate, useLoad } from '../components/ui.jsx'
import { getCapabilities } from '../services/adminApi.js'

const AUDIENCES = ['All users', 'Premium users', 'Free users']

export default function Notifications() {
  const state = useLoad(listBroadcasts)
  const caps = useLoad(getCapabilities)
  const [form, setForm] = useState({ title: '', body: '', audience: AUDIENCES[0], channel: 'PUSH' })
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!window.confirm(`Send "${form.title}" to: ${form.audience}? This cannot be recalled.`)) return
    setSending(true)
    setMsg('')
    try {
      await sendBroadcast(form)
      setForm({ ...form, title: '', body: '' })
      setMsg('Broadcast queued for delivery.')
      state.reload()
    } catch {
      setMsg('Could not send the broadcast.')
    } finally {
      setSending(false)
    }
  }

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'audience', label: 'Audience' },
    { key: 'channel', label: 'Channel' },
    { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
    { key: 'sentAt', label: 'Sent', render: (r) => fmtDate(r.sentAt) },
    { key: 'reach', label: 'Reached', render: (r) => (r.reach ? r.reach.toLocaleString() : '—') },
    { key: 'failed', label: 'Failed', render: (r) => (r.failed ? <span className="neg">{r.failed.toLocaleString()}</span> : '—') },
  ]

  return (
    <Page title="Broadcasts" subtitle="Announcements to whole segments. Targeting a single person is deliberately not possible.">
      <PrivacyNote>Audiences are broad segments, never individuals, and never based on financial behaviour.</PrivacyNote>
      {caps.data && !caps.data.broadcastDelivery && <Notice>Delivery through notification-service is not connected: broadcasts are recorded and audited but stay QUEUED.</Notice>}
      {caps.data?.broadcastDelivery && <p className="muted small">Each broadcast is delivered as an in-app notification and pushed to the phones of everyone in the segment. Delivery runs in the background; refresh to see its result.</p>}
      <Card title="New broadcast">
        <form className="form" onSubmit={submit}>
          <label>Title<input maxLength={80} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
          <label>Message<textarea rows={3} maxLength={200} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required /></label>
          <div className="form-row">
            <label>Audience<select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>{AUDIENCES.map((a) => <option key={a}>{a}</option>)}</select></label>
            <label>Channel<select value="PUSH" disabled aria-describedby="channel-note"><option value="PUSH">In-app + push</option></select><span id="channel-note" className="muted small">Every notification is also pushed to the person's phones. E-mail is not offered.</span></label>
          </div>
          <div className="form-row"><button className="btn btn-primary" disabled={sending}>{sending ? 'Sending…' : 'Send broadcast'}</button>{msg && <span className="muted">{msg}</span>}</div>
        </form>
      </Card>
      <div className="form-row"><h2>History</h2><button className="btn small btn-outline" onClick={state.reload}>Refresh</button></div>
      <Async state={state}>{(rows) => <Table columns={columns} rows={rows} />}</Async>
    </Page>
  )
}
