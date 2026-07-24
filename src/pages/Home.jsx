import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { supabase } from '../lib/supabase'
import './Home.css'

export default function Home() {
  const introRef = useRef(null)
  const bannersRef = useRef([])
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBanners() {
      try {
        const { data, error } = await supabase
          .from('hero_banners')
          .select('*, collections(slug)')
          .eq('is_active', true)
          .order('display_order', { ascending: true })
        
        if (error) throw error
        setBanners(data || [])
      } catch (err) {
        console.error("Error fetching banners:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchBanners()
  }, [])

  useEffect(() => {
    if (loading) return // Don't setup GSAP until banners are loaded

    // Reset bannersRef because we re-render dynamically
    bannersRef.current = bannersRef.current.slice(0, banners.length)

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
      bannersRef.current.forEach((banner) => {
        if (!banner) return
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
  }, [loading, banners])

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

      {/* DYNAMIC HERO BANNERS */}
      {!loading && banners.map((banner, index) => (
        <Link 
          key={banner.id} 
          to={banner.collections?.slug ? `/collection/${banner.collections.slug}` : '#'} 
          className="hero-banner" 
          ref={addToRefs}
        >
          <div className="hb-image">
            {/* We default to desktop, a real app might use <picture> or standard resize observer */}
            <img src={banner.desktop_image_url} alt={banner.title} />
          </div>
          <div className="hb-overlay"></div>
          <div className="hb-content">
            <p className="hb-eyebrow">Collection 0{index + 1}</p>
            <h2 className="hb-title" dangerouslySetInnerHTML={{ __html: banner.title.replace(/ (.+)$/, ' <em>$1</em>') }}></h2>
            {banner.subtitle && <p className="hb-subtitle">{banner.subtitle}</p>}
          </div>
        </Link>
      ))}

    </div>
  )
}
