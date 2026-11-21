import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, MessageSquare, ShieldCheck, Sparkles, TrendingUp, User } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../lib/auth.jsx'
import loginBg from '../assets/loginbg.jpg'
import './Login.css'

// Same look as the nafaqati-web sign-in (components/AuthShell): brand panel on the left, card on the right.
// Only the design is shared; the admin sign-in itself is unchanged (no sign-up, social or "remember me").
const BRAND = {
  name: 'Nafaqati',
  tagline: 'Your Money. Smarter Every Day.',
  heading: 'AI-Powered Financial Intelligence',
  subheading: 'Track. Understand. Plan. Save. Live Smarter.',
  poweredBy: 'Powered by',
  company: 'Intellivex Technologies',
}
const FEATURES = [
  [MessageSquare, 'Automatically detect transaction details from your bank messages'],
  [Sparkles, 'AI organizes your transactions into categories with an intelligent system'],
  [TrendingUp, 'AI-powered smart insights & budget management'],
  [ShieldCheck, 'Your security & privacy is our first priority'],
]

function IntellivexMark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round">
      <path d="M6 6l24 24M30 6L6 30" />
    </svg>
  )
}

export default function Login() {
  const { session, login } = useAuth()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (session) return <Navigate to="/" replace />

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(form.identifier, form.password)
    } catch (err) {
      setError(err.code === 'NOT_ADMIN' ? err.message : 'Sign-in failed. Check your credentials.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page" style={{ backgroundImage: `url(${loginBg})` }}>
      <aside className="auth-brand">
        <div className="auth-brand-top">
          <span className="auth-logo"><Logo size={72} /></span>
          <h1 className="auth-brand-title">{BRAND.name}</h1>
          <p className="auth-brand-tagline">{BRAND.tagline}</p>
        </div>

        <div className="auth-brand-body">
          <div className="auth-brand-subtitle">
            <h2>{BRAND.heading}</h2>
            <p>{BRAND.subheading}</p>
          </div>
          <ul className="auth-features">
            {FEATURES.map(([Icon, text]) => (
              <li key={text} className="auth-feature">
                <span className="auth-feature-icon"><Icon size={20} /></span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="auth-powered">
          <IntellivexMark size={34} />
          <div>
            <span>{BRAND.poweredBy}</span>
            <strong>{BRAND.company}</strong>
          </div>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-main-inner">
          <div className="auth-card">
            <h2 className="auth-title">Nafaqati Admin</h2>
            <p className="auth-subtitle">Authorised staff only. All actions are logged.</p>

            <form className="auth-form" onSubmit={submit}>
              <div className="auth-field">
                <label htmlFor="admin-identifier">Email or username</label>
                <div className="auth-input">
                  <User size={18} />
                  <input id="admin-identifier" autoComplete="username" value={form.identifier}
                    onChange={(e) => setForm({ ...form, identifier: e.target.value })} required />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="admin-password">Password</label>
                <div className="auth-input">
                  <Lock size={18} />
                  <input id="admin-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                    value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                  <button type="button" className="pwinput-eye" onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && <div className="auth-alert auth-alert-error" role="alert">{error}</div>}

              <button type="submit" className="auth-submit" disabled={busy}>
                {busy && <span className="auth-spinner" aria-hidden="true" />}
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
