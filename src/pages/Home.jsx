import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './Home.css'

export default function Home() {
  const introRef = useRef(null)
  const bannersRef = useRef([])

  useEffect(() => {
    // ScrollTrigger needs to know about window resizes
    let ctx = gsap.context(() => {
      const navLogo = document.querySelector('#nav-logo')
      const introLogo = document.querySelector('.intro-logo')
      
      if (!navLogo || !introLogo) return // Prevent crash if elements are missing

      // Hide nav logo initially
      gsap.set(navLogo, { opacity: 0 })

      // Intro Animation Timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '.intro-section',
          start: 'top top',
          end: '+=100%',
          scrub: 1,
          pin: true,
          pinSpacing: false,
          invalidateOnRefresh: true,
        }
      })

      tl.to('.intro-text', { opacity: 0, y: -30, duration: 0.3 }, 0)
        .to('.scroll-indicator', { opacity: 0, duration: 0.2 }, 0)
        .to('.intro-logo', {
          top: () => {
            const rect = navLogo.getBoundingClientRect()
            return rect.top
          },
          left: () => {
            const rect = navLogo.getBoundingClientRect()
            return rect.left
          },
          x: 0,
          y: 0,
          xPercent: 0,
          yPercent: 0,
          fontSize: () => window.getComputedStyle(navLogo).fontSize,
          letterSpacing: () => window.getComputedStyle(navLogo).letterSpacing,
          color: 'var(--text)',
          duration: 1,
          ease: 'power3.inOut'
        }, 0)
        .set(navLogo, { opacity: 1 })
        .set('.intro-logo', { opacity: 0 })

      // Banner Reveals
      bannersRef.current.forEach((banner, i) => {
        gsap.fromTo(banner.querySelector('.hb-image img'), 
          { scale: 1.15, transformOrigin: 'center top' },
          {
            scale: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: banner,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true
            }
          }
        )

        gsap.fromTo(banner.querySelector('.hb-content'),
          { opacity: 0, y: 50 },
          {
            opacity: 1, 
            y: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: banner,
              start: 'top 60%',
            }
          }
        )
      })

    }, introRef) // Scope to introRef for cleanup

    return () => {
      ctx.revert() // Cleanup GSAP animations on unmount
      gsap.set('#nav-logo', { opacity: 1 }) // Ensure nav logo is visible if leaving page
    }
  }, [])

  const addToRefs = (el) => {
    if (el && !bannersRef.current.includes(el)) {
      bannersRef.current.push(el)
    }
  }

  return (
    <div className="home-wrapper" ref={introRef}>
      
      {/* 1. OPENING INTRO */}
      <section className="intro-section">
        <div className="intro-logo">ECLIPSE</div>
        <div className="intro-text">
          <p>Eclipse was born from a singular belief —<br/>that true style exists in the space between light and shadow.</p>
        </div>
        <div className="scroll-indicator">
          <span>Scroll</span>
          <div className="scroll-line"></div>
        </div>
      </section>

      {/* 2. HERO BANNER 1 */}
      <Link to="/collection/midnight" className="hero-banner" ref={addToRefs}>
        <div className="hb-image">
          <img src="/banner_midnight.jpg" alt="Midnight Collection" />
        </div>
        <div className="hb-overlay"></div>
        <div className="hb-content">
          <p className="hb-eyebrow">Collection 01</p>
          <h2 className="hb-title">Midnight <em>Collection</em></h2>
          <p className="hb-subtitle">Own the Darkness.</p>
        </div>
      </Link>

      {/* 3. HERO BANNER 2 */}
      <Link to="/collection/urban" className="hero-banner" ref={addToRefs}>
        <div className="hb-image">
          <img src="/banner_urban.jpg" alt="Urban Eclipse" />
        </div>
        <div className="hb-overlay"></div>
        <div className="hb-content">
          <p className="hb-eyebrow">Collection 02</p>
          <h2 className="hb-title">Urban <em>Eclipse</em></h2>
          <p className="hb-subtitle">Street Luxury Redefined.</p>
        </div>
      </Link>

      {/* 4. HERO BANNER 3 */}
      <Link to="/collection/silent-luxury" className="hero-banner" ref={addToRefs}>
        <div className="hb-image">
          <img src="/banner_silent.jpg" alt="Silent Luxury" />
        </div>
        <div className="hb-overlay"></div>
        <div className="hb-content">
          <p className="hb-eyebrow">Collection 03</p>
          <h2 className="hb-title">Silent <em>Luxury</em></h2>
          <p className="hb-subtitle">Elegance Without Noise.</p>
        </div>
      </Link>

      {/* 5. HERO BANNER 4 */}
      <Link to="/collection/monochrome-essentials" className="hero-banner" ref={addToRefs}>
        <div className="hb-image">
          <img src="/banner_monochrome.jpg" alt="Monochrome Essentials" />
        </div>
        <div className="hb-overlay"></div>
        <div className="hb-content">
          <p className="hb-eyebrow">Collection 04</p>
          <h2 className="hb-title">Monochrome <em>Essentials</em></h2>
          <p className="hb-subtitle">Luxury In Simplicity.</p>
        </div>
      </Link>

    </div>
  )
}
