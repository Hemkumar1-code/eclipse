import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

// Translate raw Supabase / network errors into user-friendly messages
function getFriendlyError(err) {
  const msg = err?.message ?? ''

  if (!isSupabaseConfigured) {
    return 'Supabase configuration is missing. Please contact the administrator.'
  }
  if (
    msg === 'Failed to fetch' ||
    msg.includes('NetworkError') ||
    msg.includes('network') ||
    msg.includes('fetch')
  ) {
    return 'Unable to connect to the server. Please check your internet connection and try again.'
  }
  if (msg.toLowerCase().includes('invalid login credentials')) {
    return 'Invalid email or password.'
  }
  if (msg.toLowerCase().includes('email not confirmed')) {
    return 'Please verify your email address before logging in.'
  }
  if (msg.includes('Access Denied')) {
    return 'Your account does not have admin access.'
  }
  return msg || 'An unexpected error occurred. Please try again.'
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()

  // If already logged in and is admin, redirect to admin dashboard
  if (user) {
    if (isAdmin) return <Navigate to="/admin" replace />
    return <Navigate to="/" replace />
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (loading) return

    // Early exit if Supabase is not configured — no point making a network call
    if (!isSupabaseConfigured) {
      setError(getFriendlyError({}))
      return
    }

    setLoading(true)
    setError(null)

    try {
      const trimmedEmail = email.trim().toLowerCase()

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password, // do NOT trim passwords
      })

      if (authError) throw authError

      // Verify admin role in the users table
      const { data: roleData, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (roleError) {
        // If we can't read the role, treat as non-admin
        await supabase.auth.signOut()
        throw new Error('Access Denied: Unable to verify your account role.')
      }

      const role = roleData?.role ?? 'Customer'

      if (['Admin', 'Manager', 'Super Admin'].includes(role)) {
        navigate('/admin')
      } else {
        await supabase.auth.signOut()
        throw new Error('Access Denied: You do not have administrator privileges.')
      }
    } catch (err) {
      // Log full error in dev for debugging, never log passwords
      if (import.meta.env.DEV) {
        console.error('[Eclipse Admin Login] Error:', err?.message ?? err)
      }
      setError(getFriendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#000',
      color: '#fff',
      fontFamily: 'var(--font-body)',
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '40px',
        border: '1px solid #1F1F1F',
        borderRadius: '8px',
        backgroundColor: '#0A0A0A',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '32px',
          textAlign: 'center',
          marginBottom: '10px',
          letterSpacing: '0.2em',
        }}>ECLIPSE</h1>
        <p style={{
          textAlign: 'center',
          color: '#888',
          fontSize: '12px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '30px',
        }}>Admin Portal</p>

        {/* Configuration warning — only shown when env vars are missing */}
        {!isSupabaseConfigured && (
          <div style={{
            backgroundColor: 'rgba(255, 165, 0, 0.1)',
            border: '1px solid rgba(255, 165, 0, 0.4)',
            color: '#FFA500',
            padding: '10px 14px',
            borderRadius: '4px',
            fontSize: '12px',
            marginBottom: '20px',
            lineHeight: 1.5,
          }}>
            ⚠ Supabase environment variables are not configured.<br />
            Add <code>VITE_SUPABASE_URL</code> and{' '}
            <code>VITE_SUPABASE_ANON_KEY</code> to your{' '}
            <code>.env.local</code> file and redeploy.
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: 'rgba(255,0,0,0.1)',
            border: '1px solid rgba(255,0,0,0.3)',
            color: '#ff4444',
            padding: '10px 14px',
            borderRadius: '4px',
            fontSize: '12px',
            marginBottom: '20px',
            textAlign: 'center',
            lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              color: '#888',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#111',
                border: '1px solid #333',
                color: '#fff',
                borderRadius: '4px',
                outline: 'none',
                fontFamily: 'inherit',
                fontSize: '14px',
              }}
            />
          </div>
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              color: '#888',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#111',
                border: '1px solid #333',
                color: '#fff',
                borderRadius: '4px',
                outline: 'none',
                fontFamily: 'inherit',
                fontSize: '14px',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !isSupabaseConfigured}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading ? '#888' : '#fff',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: '600',
              fontSize: '13px',
              cursor: loading || !isSupabaseConfigured ? 'not-allowed' : 'pointer',
              marginTop: '10px',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.2s, background-color 0.2s',
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
