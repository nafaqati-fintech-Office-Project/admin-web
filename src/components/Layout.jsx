import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Bell, CreditCard, FileClock, LayoutDashboard, LogOut, Mail, Menu, Server, ShieldCheck, Trash2, Users, X } from 'lucide-react'
import { useAuth } from '../lib/auth.jsx'
import { USE_MOCKS } from '../lib/config.js'
import Logo from './Logo.jsx'

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/users', label: 'Accounts', icon: Users },
  { to: '/email-changes', label: 'Email changes', icon: Mail },
  { to: '/deletions', label: 'Deletion requests', icon: Trash2 },
  { to: '/billing', label: 'Billing', icon: CreditCard },
  { to: '/notifications', label: 'Broadcasts', icon: Bell },
  { to: '/system', label: 'System', icon: Server },
  { to: '/audit', label: 'Audit log', icon: FileClock },
]

export default function Layout() {
  const { logout } = useAuth()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const current = NAV.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)))

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="app-shell">
      <div className={`sidebar-overlay ${open ? 'is-open' : ''}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="sidebar-brand">
          <Logo />
          <span className="sidebar-brand-name">Nafaqati</span>
          <span className="role-pill">Admin</span>
          <button type="button" className="sidebar-close" onClick={() => setOpen(false)} aria-label="Close menu"><X size={20} /></button>
        </div>
        <nav className="sidebar-nav" aria-label="Main">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="nav-item">
              <Icon size={19} aria-hidden="true" /> <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-privacy">
          <ShieldCheck size={22} aria-hidden="true" />
          <div><strong>Privacy first</strong><span>Aggregates and account metadata only</span></div>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <button type="button" className="topbar-menu" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
          <div className="topbar-crumb">Admin / <span>{current?.label ?? ''}</span></div>
          <div className="topbar-actions">
            <button type="button" className="btn btn-outline small" onClick={logout}><LogOut size={15} /> Sign out</button>
          </div>
        </header>
        {USE_MOCKS && <div className="mock-banner">Demo data: admin-service is not connected. Nothing here is real.</div>}
        <main className="app-content"><Outlet /></main>
      </div>
    </div>
  )
}
