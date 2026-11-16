import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../lib/auth.jsx'

export default function Login() {
  const { session, login } = useAuth()
  const [form, setForm] = useState({ identifier: '', password: '' })
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
    <div className="login">
      <form className="card login-card" onSubmit={submit}>
        <div className="login-icon"><Logo size={52} /></div>
        <h1>Nafaqati Admin</h1>
        <p className="muted">Authorised staff only. All actions are logged.</p>
        <label>Email or username
          <input autoComplete="username" value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} required />
        </label>
        <label>Password
          <input type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  )
}
