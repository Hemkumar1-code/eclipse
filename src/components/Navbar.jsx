import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search, ShoppingBag, Heart, Menu, X, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../contexts/CartContext'
import './Navbar.css'

export default function Navbar() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { cartItems, setIsCartOpen } = useCart()
  
  const totalCartItems = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  // Prevent body scrolling when mobile menu is open
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

  return (
    <>
      <header className={`navbar ${isHome ? 'navbar-home' : 'navbar-solid'}`}>
        <div className="nav-inner">
          
          {/* The target for the intro animation logo on the homepage */}
          <Link to="/" className="nav-logo" id="nav-logo" onClick={closeMenu}>
            ECLIPSE
          </Link>

          {/* Desktop Nav */}
          <nav className="nav-links">
            <Link to="/">Home</Link>
            <div className="nav-dropdown">
              <span>Collections</span>
              <div className="dropdown-menu">
                <Link to="/collection/midnight">Midnight</Link>
                <Link to="/collection/urban">Urban</Link>
                <Link to="/collection/silent-luxury">Silent Luxury</Link>
                <Link to="/collection/monochrome-essentials">Monochrome</Link>
              </div>
            </div>
            <Link to="/#about">About</Link>
            <Link to="/#contact">Contact</Link>
          </nav>

          {/* Icons */}
          <div className="nav-icons">
            <button className="nav-icon-btn" aria-label="Search"><Search size={18} /></button>
            <button className="nav-icon-btn" aria-label="Wishlist"><Heart size={18} /></button>
            <button className="nav-icon-btn" aria-label="Cart" style={{position: 'relative'}} onClick={() => setIsCartOpen(true)}>
              <ShoppingBag size={18} />
              {totalCartItems > 0 && (
                <span style={{ position: 'absolute', top: -5, right: -5, background: 'var(--text)', color: 'var(--bg)', fontSize: '9px', width: '14px', height: '14px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {totalCartItems}
                </span>
              )}
            </button>
            <button 
              className="hamburger" 
              aria-label="Menu"
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
                <button className="mobile-menu-close" onClick={closeMenu}>
                  <X size={24} />
                </button>
              </div>
              
              <div className="mobile-menu-content">
                <nav className="mobile-nav-links">
                  <Link to="/" onClick={closeMenu}>Home</Link>
                  <div className="mobile-nav-section-title">Collections</div>
                  <Link to="/collection/midnight" onClick={closeMenu} className="sub-link">Midnight</Link>
                  <Link to="/collection/urban" onClick={closeMenu} className="sub-link">Urban</Link>
                  <Link to="/collection/silent-luxury" onClick={closeMenu} className="sub-link">Silent Luxury</Link>
                  <Link to="/collection/monochrome-essentials" onClick={closeMenu} className="sub-link">Monochrome</Link>
                  
                  <div className="mobile-nav-divider"></div>
                  
                  <Link to="/#about" onClick={closeMenu}>About</Link>
                  <Link to="/#contact" onClick={closeMenu}>Contact</Link>
                </nav>

                <div className="mobile-nav-footer">
                  <Link to="/wishlist" onClick={closeMenu}><Heart size={16} /> Wishlist</Link>
                  <button onClick={() => { setIsCartOpen(true); closeMenu(); }} style={{background: 'none', border: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0}}>
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
