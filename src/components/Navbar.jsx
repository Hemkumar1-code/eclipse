import { Link, useLocation } from 'react-router-dom'
import { Search, ShoppingBag, Heart, Menu } from 'lucide-react'
import './Navbar.css'

export default function Navbar() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <header className={`navbar ${isHome ? 'navbar-home' : 'navbar-solid'}`}>
      <div className="nav-inner">
        
        {/* The target for the intro animation logo on the homepage */}
        <Link to="/" className="nav-logo" id="nav-logo">
          ECLIPSE
        </Link>

        {/* Desktop Nav - Cleaned up and product-less for now */}
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
          <button className="nav-icon-btn" aria-label="Cart"><ShoppingBag size={18} /></button>
          <button className="hamburger" aria-label="Menu"><Menu size={24} /></button>
        </div>

      </div>
    </header>
  )
}
