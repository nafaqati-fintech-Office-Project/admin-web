import { getFlags, getHealth, getKafka, setFlag } from '../services/adminApi.js'
import { Async, Badge, Card, NotAvailable, Notice, Page, Table, useLoad } from '../components/ui.jsx'
import { getCapabilities } from '../services/adminApi.js'

export default function System() {
  const health = useLoad(getHealth)
  const kafka = useLoad(getKafka)
  const flags = useLoad(getFlags)
  const caps = useLoad(getCapabilities)

  const toggle = async (f) => {
    if (!window.confirm(`${f.enabled ? 'Disable' : 'Enable'} "${f.key}"?`)) return
    await setFlag(f.key, !f.enabled)
    flags.reload()
  }

  return (
    <Page title="System" subtitle="Service health, message backlog and feature flags" actions={<button className="btn btn-outline" onClick={() => { health.reload(); kafka.reload() }}>Refresh</button>}>
      <Async state={health}>
        {(rows) => (
          <div className="grid services">
            {rows.map((s) => (
              <div key={s.service} className={`card svc ${s.status === 'UP' ? '' : 'down'}`}>
                <div><strong>{s.service}</strong><span className="muted small"> :{s.port}</span></div>
                <div><Badge value={s.status} /> <span className="muted small">{s.latencyMs != null ? `${s.latencyMs} ms` : 'unreachable'}</span></div>
              </div>
            ))}
          </div>
        )}
      </Async>
      <h2>Kafka consumer lag</h2>
      <Async state={kafka}>
        {(rows) => rows.length === 0 ? <NotAvailable>Consumer lag is not exposed by the services yet.</NotAvailable> : <Table columns={[{ key: 'topic', label: 'Topic' }, { key: 'consumerGroup', label: 'Consumer' }, { key: 'lag', label: 'Lag (messages)', render: (r) => <span className={r.lag > 100 ? 'neg' : ''}>{r.lag}</span> }]} rows={rows.map((r, i) => ({ ...r, id: i }))} />}
      </Async>
      <h2>Feature flags</h2>
      {caps.data && !caps.data.featureFlagsEnforced && <Notice>These flags are stored and audited here, but the services do not read them yet, so changing one does not change app behaviour.</Notice>}
      <Async state={flags}>
        {(rows) => (
          <Card>
            <ul className="flags">
              {rows.map((f) => (
                <li key={f.key}>
                  <div><code>{f.key}</code><div className="muted small">{f.summary}</div></div>
                  <button className={`toggle ${f.enabled ? 'on' : ''}`} role="switch" aria-checked={f.enabled} onClick={() => toggle(f)}><span /></button>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </Async>
    </Page>
  )
}
