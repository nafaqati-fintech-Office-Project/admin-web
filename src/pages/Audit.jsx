import { getAudit } from '../services/adminApi.js'
import { Async, Badge, Page, Table, fmtDate, useLoad } from '../components/ui.jsx'

export default function Audit() {
  const state = useLoad(getAudit)
  const columns = [
    { key: 'at', label: 'When', render: (r) => fmtDate(r.at) },
    { key: 'actor', label: 'Staff member' },
    { key: 'action', label: 'Action', render: (r) => <code>{r.action}</code> },
    { key: 'target', label: 'Target', render: (r) => <code>{r.target}</code> },
    { key: 'outcome', label: 'Outcome', render: (r) => <Badge value={r.outcome} /> },
  ]
  return (
    <Page title="Audit log" subtitle="Every admin action, append-only. Targets are account refs and request ids, never personal data.">
      <Async state={state}>{(rows) => <Table columns={columns} rows={rows} />}</Async>
    </Page>
  )
}
