import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

// Translate raw Supabase / network errors into safe, user-facing messages.
// NEVER pass raw Postgres errors, table names, or schema details to this function's return value.
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
    return 'Unable to connect. Please check your internet connection and try again.'
  }
  if (msg.toLowerCase().includes('invalid login credentials')) {
    return 'Invalid email or password.'
  }
  if (msg.toLowerCase().includes('email not confirmed')) {
    return 'Please verify your email before signing in.'
  }
  // Role not in allowed list
  if (msg === 'ROLE_NOT_ADMIN') {
    return 'Your account does not have admin access.'
  }
  // Role/profile query failed (RLS, missing table, missing row, etc.)
  if (msg === 'ROLE_VERIFICATION_FAILED') {
    return 'Your admin profile could not be verified. Please contact the administrator.'
  }
  // Any other uncaught error — safe fallback
  return 'Unable to sign in. Please try again.'
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
        // Log the real Supabase error in dev mode so it is visible in DevTools.
        // This exposes the actual failure (e.g. missing table, RLS block, no row)
        // without surfacing it in the production UI.
        if (import.meta.env.DEV) {
          console.error('[Eclipse Admin] Role verification error:', roleError.message, roleError)
        }
        await supabase.auth.signOut()
        // Use a sentinel string so getFriendlyError maps to the correct safe message.
        throw new Error('ROLE_VERIFICATION_FAILED')
      }

      const role = roleData?.role ?? 'Customer'

      if (['Admin', 'Manager', 'Super Admin'].includes(role)) {
        navigate('/admin')
      } else {
        await supabase.auth.signOut()
        throw new Error('ROLE_NOT_ADMIN')
      }
    } catch (err) {
      // Log full error in dev for debugging — never log passwords or tokens
      if (import.meta.env.DEV) {
        console.error('[Eclipse Admin Login] Error:', err?.message ?? err)
      }
      setError(getFriendlyError(err))
    } finally {
      // Always reset loading — guaranteed in every success and error path
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
            backgroundColor: 'rgba(255, 165, 0, 0.08)',
            border: '1px solid rgba(255, 165, 0, 0.4)',
            color: '#FFA500',
            padding: '14px 16px',
            borderRadius: '4px',
            fontSize: '11px',
            marginBottom: '20px',
            lineHeight: 1.7,
          }}>
            <strong style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}>
              ⚠ Supabase is not configured
            </strong>
            <strong>Local development:</strong> Create a{' '}
            <code style={{ background: 'rgba(255,165,0,0.15)', padding: '1px 4px', borderRadius: '2px' }}>.env.local</code>{' '}
            file in the project root and add:<br />
            <code style={{ display: 'block', marginTop: '4px', marginBottom: '8px', padding: '4px 8px', background: 'rgba(0,0,0,0.3)', borderRadius: '2px', fontSize: '10px' }}>
              VITE_SUPABASE_URL=https://your-project.supabase.co<br />
              VITE_SUPABASE_ANON_KEY=your-anon-key
            </code>
            <strong>Vercel (production):</strong> Add the same two variables in{' '}
            Vercel Dashboard → Project → Settings → Environment Variables,
            then trigger a new deployment. Vite bakes env vars into the bundle
            at build time — updating variables alone is not enough; a rebuild is required.
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
