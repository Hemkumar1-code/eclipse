import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Loader } from 'lucide-react'

export default function AdminProtectedRoute() {
  const { user, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', color: '#fff' }}>
        <Loader className="animate-spin" size={32} />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  if (!isAdmin) {
    // If a normal customer accidentally ends up here, bounce them to the homepage
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
