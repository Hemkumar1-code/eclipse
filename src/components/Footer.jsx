import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{
      padding: '80px 20px 40px',
      borderTop: '1px solid var(--border)',
      textAlign: 'center',
      backgroundColor: 'var(--bg)'
    }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '24px',
        letterSpacing: '0.35em',
        textTransform: 'uppercase',
        marginBottom: '20px'
      }}>
        ECLIPSE
      </div>
      <p style={{
        fontSize: '11px',
        color: 'var(--text-muted)',
        letterSpacing: '0.1em',
        maxWidth: '400px',
        margin: '0 auto 40px',
        lineHeight: '1.8'
      }}>
        Premium Men's Fashion. Crafted for the modern man who refuses to be ordinary.
      </p>
      
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '30px',
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        color: 'var(--text-dim)',
        marginBottom: '40px'
      }}>
        <Link to="/#privacy">Privacy</Link>
        <Link to="/#terms">Terms</Link>
        <Link to="/#shipping">Shipping</Link>
      </div>

      <p style={{
        fontSize: '10px',
        color: 'var(--text-dim)',
        letterSpacing: '0.05em'
      }}>
        © {new Date().getFullYear()} Eclipse Premium Menswear Pvt. Ltd. All rights reserved.
      </p>
    </footer>
  )
}
