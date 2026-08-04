import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { supabase } from '../lib/supabase'
import HomeProductSections from '../components/HomeProductSections'
import './Home.css'

gsap.registerPlugin(ScrollTrigger)

export default function Home() {
  const introRef = useRef(null)
  const bannersRef = useRef([])
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)

  // ── Fetch hero banners ──────────────────────────────────────────────────
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
        console.error('Error fetching banners:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchBanners()
  }, [])

  // ── GSAP animations (runs after banners are loaded) ────────────────────
  useEffect(() => {
    if (loading) return

    bannersRef.current = bannersRef.current.slice(0, banners.length)

    const navLogo = document.querySelector('#nav-logo')
    const introLogo = document.querySelector('.intro-logo')
    if (!navLogo || !introLogo) return

    // ─────────────────────────────────────────────────────────────────────
    // STEP 1 — Initialize logo transform safely
    // GSAP parses CSS translate() into pixel x/y. We force it to use
    // xPercent/yPercent instead, so we can cleanly animate x and y to the navbar.
    // ─────────────────────────────────────────────────────────────────────
    gsap.set(introLogo, { xPercent: -50, yPercent: -50, x: 0, y: 0, autoAlpha: 1 })

    // ─────────────────────────────────────────────────────────────────────
    // STEP 2 — Hide nav logo (revealed safely at animation end)
    // autoAlpha handles both opacity and visibility for perfect reversing
    // ─────────────────────────────────────────────────────────────────────
    gsap.set(navLogo, { autoAlpha: 0 })

    // ─────────────────────────────────────────────────────────────────────
    // STEP 3 — matchMedia for mobile vs desktop differences
    // ─────────────────────────────────────────────────────────────────────
    const mm = gsap.matchMedia()

    // Setup debounced ResizeObserver to refresh ScrollTrigger if document height
    // changes (e.g. when dynamic product skeletons are replaced with real data).
    let rafId = null
    const ro = new ResizeObserver(() => {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        ScrollTrigger.refresh()
      })
    })
    ro.observe(document.body)

    mm.add(
      {
        isDesktop: '(min-width: 768px)',
        isMobile: '(max-width: 767px)',
      },
      (context) => {
        const tl = gsap.timeline({
          scrollTrigger: {
            id: 'intro-pin',
            trigger: '.intro-section',
            start: 'top top',
            end: '+=100%',
            // scrub: true (instant) is 1:1 with native touch on mobile, preventing
            // the 'jerky' double-smoothing lag caused by scrub: 1
            scrub: true,
            pin: true,
            // pinSpacing: false lets the next element (.hero-banner) slide up
            // UNDERNEATH the pinned intro section, completely eliminating the black gap.
            pinSpacing: false,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        })

        tl
          // ── Fade out story text (move down to separate from logo) ────
          .fromTo('.intro-text',
            { opacity: 1, y: 0 },
            { opacity: 0, y: 30, duration: 0.3 },
            0
          )

          // ── Fade out scroll indicator ────────────────────────────────
          .fromTo('.scroll-indicator',
            { opacity: 1 },
            { opacity: 0, duration: 0.2 },
            0
          )

          // ── Fade intro background to reveal hero banner sliding up ───
          .fromTo('.intro-section',
            { backgroundColor: 'var(--bg)' },
            { backgroundColor: 'rgba(10, 10, 10, 0)', duration: 1, ease: 'power2.inOut' },
            0
          )

          // ── Fly logo up to navbar using transforms (FLIP strategy) ───
          // .fromTo ensures start values are recalculated perfectly on mobile
          // resize/refresh, preventing any sudden layout jumps mid-scrub.
          .fromTo('.intro-logo',
            { x: 0, y: 0, scale: 1, color: 'var(--accent)' },
            {
              duration: 1,
              ease: 'power3.inOut',
              x: () => {
                const navRect = navLogo.getBoundingClientRect()
                return (navRect.left + navRect.width / 2) - (window.innerWidth / 2)
              },
              y: () => {
                const navRect = navLogo.getBoundingClientRect()
                return (navRect.top + navRect.height / 2) - (window.innerHeight / 2)
              },
              scale: () => navLogo.offsetWidth / introLogo.offsetWidth,
              color: 'var(--text)',
            },
            0
          )

          // ── Crossfade swap: show real nav logo, hide intro logo ──────
          // Using .fromTo() explicitly defines the start and end states.
          // This prevents ScrollTrigger's immediateRender from accidentally
          // hiding the intro logo on initial page load during pre-calculation.
          .fromTo(navLogo,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.05, immediateRender: false },
            0.95
          )
          .fromTo('.intro-logo',
            { autoAlpha: 1 },
            { autoAlpha: 0, duration: 0.05, immediateRender: false },
            0.95
          )

        // ── Hero banner parallax ──────────────────────────────────────
        bannersRef.current.forEach((banner) => {
          if (!banner) return
          const img = banner.querySelector('.hb-image img')
          const content = banner.querySelector('.hb-content')

          if (img) {
            gsap.fromTo(img,
              { scale: 1.1, transformOrigin: 'center top' },
              {
                scale: 1,
                ease: 'none',
                scrollTrigger: {
                  trigger: banner,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: true,
                },
              }
            )
          }

          if (content) {
            gsap.fromTo(content,
              { opacity: 0, y: 40 },
              {
                opacity: 1,
                y: 0,
                duration: 1.2,
                ease: 'expo.out',
                scrollTrigger: {
                  trigger: banner,
                  start: 'top 65%',
                },
              }
            )
          }
        })

        return () => { /* mm.revert() below handles all cleanup */ }
      }
    )

    return () => {
      ro.disconnect()
      if (rafId) cancelAnimationFrame(rafId)
      
      mm.revert()
      // Restore nav logo for pages other than Home
      gsap.set('#nav-logo', { clearProps: 'all' })
      // Remove all GSAP inline styles from the intro logo (restores CSS)
      gsap.set('.intro-logo', { clearProps: 'all' })
    }
  }, [loading, banners])

  const addToRefs = (el) => {
    if (el && !bannersRef.current.includes(el)) {
      bannersRef.current.push(el)
    }
  }

  return (
    <div className="home-wrapper" ref={introRef}>

      {/* ── INTRO SECTION ─────────────────────────────── */}
      <section className="intro-section">
        <div className="intro-logo">ECLIPSE</div>
        <div className="intro-text">
          <p>
            Eclipse was born from a singular belief —<br />
            that true style exists in the space between light and shadow.
          </p>
        </div>
        <div className="scroll-indicator">
          <span>Scroll</span>
          <div className="scroll-line"></div>
        </div>
      </section>

      {/* ── DYNAMIC HERO BANNERS ──────────────────────── */}
      {!loading && banners.map((banner, index) => (
        <Link
          key={banner.id}
          to={banner.collections?.slug ? `/collection/${banner.collections.slug}` : '#'}
          className="hero-banner"
          ref={addToRefs}
        >
          <div className="hb-image">
            <img
              src={banner.desktop_image_url}
              alt={banner.title}
              loading={index === 0 ? 'eager' : 'lazy'}
            />
          </div>
          <div className="hb-overlay"></div>
          <div className="hb-content">
            <p className="hb-eyebrow">Collection 0{index + 1}</p>
            <h2
              className="hb-title"
              dangerouslySetInnerHTML={{
                __html: banner.title.replace(/ (.+)$/, ' <em>$1</em>'),
              }}
            ></h2>
            {banner.subtitle && <p className="hb-subtitle">{banner.subtitle}</p>}
          </div>
        </Link>
      ))}

      {/* ── PRODUCT SECTIONS ──────────────────────────── */}
      <HomeProductSections />

      {/* ── ABOUT SECTION (target for /#about nav links) ── */}
      <section id="about" className="home-section">
        <div className="home-section__inner">
          <p className="home-section__eyebrow">Our Story</p>
          <h2 className="home-section__title">About Eclipse</h2>
          <div className="home-section__rule" aria-hidden="true" />
          <p className="home-section__text">
            Eclipse was born from a singular belief — that true style
            exists in the space between light and shadow. We craft
            premium menswear for those who understand that elegance
            is not worn, it is lived.
          </p>
          <p className="home-section__text" style={{ marginTop: '20px' }}>
            Every garment in our collection is a deliberate act of
            restraint. Less spectacle. More substance. Designed for
            the modern man who moves through the world with quiet
            confidence and uncompromising taste.
          </p>
        </div>
      </section>

      {/* ── CONTACT SECTION (target for /#contact nav links) ── */}
      <section id="contact" className="home-section home-section--contact">
        <div className="home-section__inner">
          <p className="home-section__eyebrow">Get In Touch</p>
          <h2 className="home-section__title">Contact</h2>
          <div className="home-section__rule" aria-hidden="true" />
          <p className="home-section__text">
            For enquiries, bespoke styling consultations, or wholesale
            partnerships, our team is available Monday to Saturday,
            10 am – 6 pm IST.
          </p>
          <a
            href="mailto:hello@eclipse.co"
            className="home-section__cta"
            aria-label="Email Eclipse"
          >
            hello@eclipse.co
          </a>
        </div>
      </section>

    </div>
  )
}
