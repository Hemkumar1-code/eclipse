import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from '@studio-freight/lenis'

import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import AdminProtectedRoute from './components/Admin/AdminProtectedRoute'
import AdminLogin from './pages/Admin/Login'

import AdminLayout from './components/Admin/AdminLayout'

import Navbar from './components/Navbar'
import CartDrawer from './components/CartDrawer'
import Footer from './components/Footer'
import Home from './pages/Home'
import NotFound from './pages/NotFound'

gsap.registerPlugin(ScrollTrigger)

import Collection from './pages/Collection'
import Product from './pages/Product'
import Checkout from './pages/Checkout'

import AdminDashboard from './pages/Admin/Dashboard'
import AdminHeroBanners from './pages/Admin/HeroBanners'
import AdminHeroBannerForm from './pages/Admin/HeroBannerForm'
import AdminProducts from './pages/Admin/Products'
import AdminProductForm from './pages/Admin/ProductForm'

import { setLenisInstance, scrollToSection } from './lib/lenis-instance'

function App() {
  const location = useLocation()
  
  // Disable Lenis and Nav/Footer on Admin routes
  const isAdminRoute = location.pathname.startsWith('/admin')

  useEffect(() => {
    if (isAdminRoute) return // No smooth scroll in admin panel

    // Prevent browser from automatically restoring scroll position on refresh.
    // We want the Home page to always start at the top so the intro plays.
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    // Initialize Lenis — exact same config as before, preserved
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    })

    // Connect Lenis to GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update)

    // Store the ticker function so we can remove the EXACT same reference
    // in cleanup. Previously `gsap.ticker.remove(lenis.raf)` was used but
    // the ADDED function was an arrow wrapper — not lenis.raf itself — so
    // removal was silently a no-op. Fixed here.
    const tickerFn = (time) => { lenis.raf(time * 1000) }
    gsap.ticker.add(tickerFn)
    gsap.ticker.lagSmoothing(0)

    // Register lenis instance so Navbar / other components can use
    // scrollToSection() without importing or prop-drilling Lenis
    setLenisInstance(lenis)

    // Always reset scroll position on route change
    window.scrollTo(0, 0)
    lenis.scrollTo(0, { immediate: true })

    // Handle hash-based navigation (e.g., navigating from /product/:id to /#about)
    // The delay accounts for:
    //   1. React rendering the Home page
    //   2. Supabase fetching hero banners (~100–500 ms)
    //   3. GSAP setting up the intro pin + spacer (must be in place before scrolling
    //      further, otherwise scroll-position math is off by 100vh)
    if (location.hash) {
      const sectionId = location.hash.replace('#', '')
      
      // Safely remove the hash from the URL immediately.
      // This ensures that if the user refreshes, they stay at the top
      // and do not trigger a browser jump or restore previous scroll state.
      window.history.replaceState(null, '', location.pathname + location.search)

      setTimeout(() => {
        scrollToSection(sectionId)
      }, 1000)
    }

    return () => {
      lenis.destroy()
      gsap.ticker.remove(tickerFn) // Remove the correct reference (bug fix)
      setLenisInstance(null)       // Clear stale ref so scrollToSection falls back to native
    }
  }, [location.pathname, isAdminRoute])
  // NOTE: location.hash is intentionally NOT in deps — hash changes on the
  // same pathname are handled by Navbar's onClick handlers directly.

  return (
    <AuthProvider>
      <CartProvider>
        {!isAdminRoute && <Navbar />}
        {!isAdminRoute && <CartDrawer />}
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/" element={<Home />} />
          <Route path="/collection/:slug" element={<Collection />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/checkout" element={<Checkout />} />
          
          {/* ADMIN ROUTES */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="hero-banners" element={<AdminHeroBanners />} />
              <Route path="hero-banners/new" element={<AdminHeroBannerForm />} />
              <Route path="hero-banners/:id" element={<AdminHeroBannerForm />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/new" element={<AdminProductForm />} />
              <Route path="products/:id" element={<AdminProductForm />} />
            </Route>
          </Route>

          {/* Catch-all route for 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        {!isAdminRoute && <Footer />}
      </CartProvider>
    </AuthProvider>
  )
}

export default App
