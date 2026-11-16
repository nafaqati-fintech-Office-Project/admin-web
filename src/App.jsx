import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { useAuth } from './lib/auth.jsx'
import Audit from './pages/Audit.jsx'
import Billing from './pages/Billing.jsx'
import Login from './pages/Login.jsx'
import Notifications from './pages/Notifications.jsx'
import Overview from './pages/Overview.jsx'
import { Deletions, EmailChanges } from './pages/Requests.jsx'
import System from './pages/System.jsx'
import Users from './pages/Users.jsx'

function Protected({ children }) {
  const { session } = useAuth()
  return session ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route index element={<Overview />} />
        <Route path="users" element={<Users />} />
        <Route path="email-changes" element={<EmailChanges />} />
        <Route path="deletions" element={<Deletions />} />
        <Route path="billing" element={<Billing />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="system" element={<System />} />
        <Route path="audit" element={<Audit />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
