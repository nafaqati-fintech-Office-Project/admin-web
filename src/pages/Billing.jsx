import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getBilling } from '../services/adminApi.js'
import { suppressSmall } from '../lib/privacy.js'
import { Async, Card, NotAvailable, Notice, Page, PrivacyNote, Stat, useLoad } from '../components/ui.jsx'

export default function Billing() {
  const state = useLoad(getBilling)
  return (
    <Page title="Billing" subtitle="Subscription health. Counts and rates only: no payer identities, cards or payment amounts per person.">
      <PrivacyNote>Payment details stay with the payment provider (Paymob). This panel never receives card data or individual payments.</PrivacyNote>
      <Async state={state}>
        {(d) => (
          <>
            {!d.available && <Notice>billing-service did not answer, so these figures are unavailable.</Notice>}
            <div className="grid stats">
              <Stat label="Active subscriptions" value={d.totals.activeSubscriptions?.toLocaleString()} />
              <Stat label="Past due (in grace period)" value={d.totals.pastDue} />
              <Stat label="30-day churn" value={d.totals.churn30d == null ? null : `${d.totals.churn30d}%`} />
              <Stat label="Failed payments (7d)" value={d.totals.failedPayments7d} />
            </div>
            <div className="grid two">
              {d.growthIndex.length > 0 && <Card title="Subscription growth (index, 100 = start)">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={d.growthIndex}>
                    <CartesianGrid stroke="var(--line)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={36} />
                    <Tooltip />
                    <Line dataKey="value" stroke="var(--brand)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>}
              <div className="grid">
                {[['By plan', d.byPlan], ['Successful payments by provider (30d)', d.byProvider]].map(([title, rows]) => (
                  <Card key={title} title={title}>
                    {rows.length === 0 ? <NotAvailable /> : <ul className="breakdown">{rows.map((r) => <li key={r.label}><span>{r.label}</span><strong>{suppressSmall(r.count)}</strong></li>)}</ul>}
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </Async>
    </Page>
  )
}
