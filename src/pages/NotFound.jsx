import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg)',
      color: 'var(--text)',
      textAlign: 'center',
      padding: '0 20px'
    }}>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(40px, 8vw, 80px)',
        fontWeight: '300',
        letterSpacing: '0.1em',
        marginBottom: '20px',
        color: 'var(--accent)'
      }}>404</h1>
      <h2 style={{
        fontFamily: 'var(--font-body)',
        fontSize: '18px',
        fontWeight: '300',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        marginBottom: '40px'
      }}>Page Not Found</h2>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '14px',
        color: 'var(--text-muted)',
        marginBottom: '40px',
        maxWidth: '400px',
        lineHeight: '1.6'
      }}>
        The page you are looking for has vanished into the shadows.
      </p>
      <Link to="/" style={{
        padding: '12px 30px',
        border: '1px solid var(--border)',
        fontFamily: 'var(--font-body)',
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
        color: 'var(--text)',
        transition: 'all 0.3s ease',
      }}
      onMouseOver={(e) => {
        e.target.style.backgroundColor = 'var(--text)'
        e.target.style.color = 'var(--bg)'
      }}
      onMouseOut={(e) => {
        e.target.style.backgroundColor = 'transparent'
        e.target.style.color = 'var(--text)'
      }}>
        Return Home
      </Link>
    </div>
  )
}
