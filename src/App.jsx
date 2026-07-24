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

function App() {
  const location = useLocation()
  
  // Disable Lenis and Nav/Footer on Admin routes
  const isAdminRoute = location.pathname.startsWith('/admin')

  useEffect(() => {
    if (isAdminRoute) return // No smooth scroll in admin panel

    // Initialize Lenis
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

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })

    gsap.ticker.lagSmoothing(0)

    // Scroll to top on route change
    window.scrollTo(0, 0)
    lenis.scrollTo(0, { immediate: true })

    return () => {
      lenis.destroy()
      gsap.ticker.remove(lenis.raf)
    }
  }, [location.pathname, isAdminRoute])

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
