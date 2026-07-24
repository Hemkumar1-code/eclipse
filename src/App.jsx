import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from '@studio-freight/lenis'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'

gsap.registerPlugin(ScrollTrigger)

// Placeholder for later phases
const Collection = () => <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'}}>Collection Page Placeholder</div>

function App() {
  const location = useLocation()

  useEffect(() => {
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
  }, [location.pathname])

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/collection/:slug" element={<Collection />} />
      </Routes>
      <Footer />
    </>
  )
}

export default App
