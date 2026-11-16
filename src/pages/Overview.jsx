import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getOverview } from '../services/adminApi.js'
import { suppressSmall } from '../lib/privacy.js'
import { Async, Card, NotAvailable, Page, PrivacyNote, Stat, useLoad } from '../components/ui.jsx'

const n = (v) => (v == null ? null : v.toLocaleString())

function Breakdown({ title, rows }) {
  return (
    <Card title={title}>
      {rows.length === 0 ? <NotAvailable /> : (
        <ul className="breakdown">
          {rows.map((r) => (
            <li key={r.label}><span>{r.label}</span><strong>{suppressSmall(r.count)}</strong></li>
          ))}
        </ul>
      )}
    </Card>
  )
}

const TimeChart = ({ data, color }) => (data.length === 0 ? <NotAvailable /> : (
  <ResponsiveContainer width="100%" height={220}>
    <AreaChart data={data}>
      <CartesianGrid stroke="var(--line)" vertical={false} />
      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
      <Tooltip />
      <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.15} strokeWidth={2} />
    </AreaChart>
  </ResponsiveContainer>
))

export default function Overview() {
  const state = useLoad(getOverview)
  return (
    <Page title="Overview" subtitle="Platform-wide aggregates for the last 30 days">
      <PrivacyNote />
      <Async state={state}>
        {(d) => (
          <>
            <div className="grid stats">
              <Stat label="Registered accounts" value={n(d.totals.users)} delta={d.deltas.users} />
              <Stat label="Active accounts (30d)" value={n(d.totals.activeUsers30d)} delta={d.deltas.activeUsers30d} />
              <Stat label="Premium subscribers" value={n(d.totals.premium)} delta={d.deltas.premium} />
              <Stat label="Families" value={n(d.totals.families)} delta={d.deltas.families} />
            </div>
            <div className="grid two">
              <Card title="New sign-ups per day"><TimeChart data={d.signups} color="var(--brand)" /></Card>
              <Card title="Daily active accounts"><TimeChart data={d.dailyActive} color="var(--accent)" /></Card>
            </div>
            <div className="grid three">
              <Breakdown title="Plans" rows={d.planBreakdown} />
              <Breakdown title="Platforms" rows={d.platformBreakdown} />
              <Breakdown title="Feature adoption (accounts)" rows={d.featureAdoption} />
            </div>
            {d.featureAdoption.length > 0 && <Card title="Feature adoption">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={d.featureAdoption.filter((r) => r.count >= 5)} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="label" width={90} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--brand)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
              <p className="muted small">Groups smaller than 5 accounts are hidden to prevent identifying individuals.</p>
            </Card>}
          </>
        )}
      </Async>
    </Page>
  )
}
