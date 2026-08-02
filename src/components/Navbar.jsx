import { useState, useEffect, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Search, ShoppingBag, Heart, Menu, X, User, RefreshCw, Loader } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../contexts/CartContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { scrollToSection } from '../lib/lenis-instance'
import './Navbar.css'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { cartItems, setIsCartOpen } = useCart()

  // ── Dynamic collections from Supabase ──────────────────────────────────
  const [collections, setCollections] = useState([])
  const [collectionsLoading, setCollectionsLoading] = useState(true)
  const [collectionsError, setCollectionsError] = useState(null)

  const fetchCollections = useCallback(async () => {
    // Guard: if Supabase is not configured, don't attempt a doomed fetch
    if (!isSupabaseConfigured) {
      setCollectionsLoading(false)
      setCollectionsError('not-configured')
      return
    }

    try {
      setCollectionsLoading(true)
      setCollectionsError(null)

      const { data, error } = await supabase
        .from('collections')
        .select('id, name, slug')
        .order('name', { ascending: true })

      if (error) throw error
      setCollections(data || [])
    } catch (err) {
      console.error('[Eclipse] Failed to fetch collections for nav:', err)
      setCollectionsError('fetch-failed')
    } finally {
      setCollectionsLoading(false)
    }
  }, [])

  // Fetch once when Navbar first mounts (persists across same-session navigations)
  useEffect(() => {
    fetchCollections()
  }, [fetchCollections])

  const totalCartItems = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  // ── Body scroll lock when mobile menu is open ──────────────────────────
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('resize', handleResize)
    }
  }, [isMobileMenuOpen])

  const closeMenu = () => setIsMobileMenuOpen(false)

  // ── Scroll-to-section handler (About / Contact) ────────────────────────
  //
  // Two cases:
  //   A) Already on "/" → prevent Link navigation, scroll immediately (desktop)
  //      or after the drawer close animation (mobile, 450 ms).
  //   B) On another route → let the Link navigate to "/#about". App.jsx's
  //      useEffect detects location.hash after the pathname change and calls
  //      scrollToSection() after a 1 000 ms delay (enough for banners to
  //      load and GSAP to set up the intro pin spacer).
  //
  const handleSectionDesktop = (e, sectionId) => {
    if (location.pathname === '/') {
      e.preventDefault()
      scrollToSection(sectionId)
    }
    // else: let Link navigate to /#sectionId — App.jsx handles the scroll
  }

  const handleSectionMobile = (e, sectionId) => {
    if (location.pathname === '/') {
      e.preventDefault()
      closeMenu()
      // Wait for the drawer exit animation (0.4 s) before scrolling
      setTimeout(() => scrollToSection(sectionId), 450)
    } else {
      closeMenu()
      // Navigate to home with hash; App.jsx's hash handler fires 1 s after mount
      navigate(`/#${sectionId}`)
    }
  }

  return (
    <>
      <header className={`navbar ${isHome ? 'navbar-home' : 'navbar-solid'}`}>
        <div className="nav-inner">
          
          {/* Target for the intro animation logo fly-in on the homepage */}
          <Link to="/" className="nav-logo" id="nav-logo" onClick={closeMenu}>
            ECLIPSE
          </Link>

          {/* Desktop Nav */}
          <nav className="nav-links">
            <Link to="/">Home</Link>

            {/* Collections dropdown — populated dynamically from Supabase */}
            <div className="nav-dropdown">
              <span>Collections</span>
              <div className="dropdown-menu">
                {collectionsLoading && (
                  <span className="dropdown-status">Loading…</span>
                )}
                {!collectionsLoading && collectionsError && (
                  <button
                    className="dropdown-retry-btn"
                    onClick={fetchCollections}
                    aria-label="Retry loading collections"
                  >
                    <RefreshCw size={11} style={{ display: 'inline', marginRight: '5px' }} />
                    Retry
                  </button>
                )}
                {!collectionsLoading && !collectionsError && collections.length === 0 && (
                  <span className="dropdown-status">No collections found</span>
                )}
                {!collectionsLoading && !collectionsError && collections.map((c) => (
                  <Link key={c.id} to={`/collection/${c.slug}`}>{c.name}</Link>
                ))}
              </div>
            </div>

            <Link to="/#about" onClick={(e) => handleSectionDesktop(e, 'about')}>About</Link>
            <Link to="/#contact" onClick={(e) => handleSectionDesktop(e, 'contact')}>Contact</Link>
          </nav>

          {/* Icons */}
          <div className="nav-icons">
            <button className="nav-icon-btn" aria-label="Search"><Search size={18} /></button>
            <button className="nav-icon-btn" aria-label="Wishlist"><Heart size={18} /></button>
            <button
              className="nav-icon-btn"
              aria-label="Cart"
              style={{ position: 'relative' }}
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag size={18} />
              {totalCartItems > 0 && (
                <span style={{
                  position: 'absolute', top: -5, right: -5,
                  background: 'var(--text)', color: 'var(--bg)',
                  fontSize: '9px', width: '14px', height: '14px',
                  borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {totalCartItems}
                </span>
              )}
            </button>
            <button
              className="hamburger"
              aria-label="Open menu"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mobile-menu-backdrop"
              onClick={closeMenu}
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mobile-menu-drawer"
            >
              <div className="mobile-menu-header">
                <span className="mobile-menu-title">ECLIPSE</span>
                <button className="mobile-menu-close" onClick={closeMenu} aria-label="Close menu">
                  <X size={24} />
                </button>
              </div>
              
              <div className="mobile-menu-content">
                <nav className="mobile-nav-links">
                  <Link to="/" onClick={closeMenu}>Home</Link>

                  {/* Collections — dynamic from Supabase */}
                  <div className="mobile-nav-section-title">Collections</div>

                  {collectionsLoading && (
                    <span className="mobile-collections-status">
                      <Loader size={12} className="spin-icon" />
                      Loading…
                    </span>
                  )}

                  {!collectionsLoading && collectionsError === 'not-configured' && (
                    <span className="mobile-collections-status mobile-collections-status--warn">
                      Supabase not configured
                    </span>
                  )}

                  {!collectionsLoading && collectionsError === 'fetch-failed' && (
                    <div className="mobile-collections-error-row">
                      <span className="mobile-collections-error-text">Failed to load</span>
                      <button
                        className="mobile-collections-retry-btn"
                        onClick={fetchCollections}
                        aria-label="Retry loading collections"
                      >
                        <RefreshCw size={11} />
                        Retry
                      </button>
                    </div>
                  )}

                  {!collectionsLoading && !collectionsError && collections.length === 0 && (
                    <span className="mobile-collections-status">No collections found</span>
                  )}

                  {!collectionsLoading && !collectionsError && collections.map((c) => (
                    <Link
                      key={c.id}
                      to={`/collection/${c.slug}`}
                      onClick={closeMenu}
                      className="sub-link"
                    >
                      {c.name}
                    </Link>
                  ))}

                  <div className="mobile-nav-divider" />

                  {/* About — scrolls to #about section on the home page */}
                  <Link
                    to="/#about"
                    onClick={(e) => handleSectionMobile(e, 'about')}
                  >
                    About
                  </Link>

                  {/* Contact — scrolls to #contact section on the home page */}
                  <Link
                    to="/#contact"
                    onClick={(e) => handleSectionMobile(e, 'contact')}
                  >
                    Contact
                  </Link>
                </nav>

                <div className="mobile-nav-footer">
                  <Link to="/wishlist" onClick={closeMenu}><Heart size={16} /> Wishlist</Link>
                  <button
                    onClick={() => { setIsCartOpen(true); closeMenu() }}
                    style={{
                      background: 'none', border: 'none', color: 'inherit',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      cursor: 'pointer', fontFamily: 'inherit',
                      fontSize: 'inherit', padding: 0,
                    }}
                  >
                    <ShoppingBag size={16} /> Cart
                  </button>
                  <Link to="/admin/login" onClick={closeMenu}><User size={16} /> Login</Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
