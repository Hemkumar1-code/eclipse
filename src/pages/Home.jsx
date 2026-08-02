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
    // STEP 1 — Transfer position ownership from CSS to GSAP
    //
    // ROOT CAUSE OF LOGO JUMP:
    //   The CSS has  top:50%; left:50%; transform:translate(-50%,-50%)
    //   When GSAP reads the element it sees xPercent:-50, yPercent:-50.
    //   The tween target sets xPercent:0, yPercent:0 — which shifts the
    //   logo right/down by 50% of its own size AS A SEPARATE MOTION while
    //   top/left are also animating. This creates the visible jump.
    //
    // FIX:
    //   Read the *rendered* pixel position via getBoundingClientRect()
    //   (which already accounts for the CSS translate) and hand those
    //   pixel values to GSAP. GSAP inline styles override CSS styles, so
    //   setting x:0, y:0, xPercent:0, yPercent:0 clears GSAP's internal
    //   translate and the element stays visually where it was. After this
    //   call GSAP is the sole owner of the element's position. No CSS vs
    //   GSAP conflict is possible.
    // ─────────────────────────────────────────────────────────────────────
    const initialBcr = introLogo.getBoundingClientRect()
    gsap.set(introLogo, {
      // Pixel position of the rendered center — EXACTLY where CSS put it
      top: initialBcr.top,
      left: initialBcr.left,
      // Zero out GSAP's own transform so it doesn't fight the CSS transform
      x: 0,
      y: 0,
      xPercent: 0,
      yPercent: 0,
    })

    // ─────────────────────────────────────────────────────────────────────
    // STEP 2 — Hide nav logo (revealed atomically at animation end)
    // ─────────────────────────────────────────────────────────────────────
    gsap.set(navLogo, { opacity: 0 })

    // ─────────────────────────────────────────────────────────────────────
    // STEP 3 — Helper: compute centered pixel position (for onRefresh)
    // ─────────────────────────────────────────────────────────────────────
    function centeredLogoPosition() {
      const logoW = introLogo.offsetWidth
      const logoH = introLogo.offsetHeight
      return {
        top: (window.innerHeight - logoH) / 2,
        left: (window.innerWidth - logoW) / 2,
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    // STEP 4 — matchMedia for mobile vs desktop differences
    // ─────────────────────────────────────────────────────────────────────
    const mm = gsap.matchMedia()

    mm.add(
      {
        isDesktop: '(min-width: 768px)',
        isMobile: '(max-width: 767px)',
      },
      (context) => {
        const { isDesktop } = context.conditions

        const tl = gsap.timeline({
          scrollTrigger: {
            id: 'intro-pin',
            trigger: '.intro-section',
            start: 'top top',
            end: '+=100%',
            scrub: 1,
            pin: true,
            // ─────────────────────────────────────────────────────────
            // pinSpacing: true (default)
            //   GSAP inserts a spacer div whose height = scroll distance.
            //   This keeps the document flow intact so the first hero
            //   banner appears immediately after the intro pin releases.
            //   Setting it to false would require a second scroll to
            //   reach the hero banner (the "extra black screen" bug).
            // ─────────────────────────────────────────────────────────
            pinSpacing: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            // ─────────────────────────────────────────────────────────
            // onRefresh — called AFTER ScrollTrigger.refresh() finishes.
            // DO NOT call ScrollTrigger.refresh() from inside here.
            // That caused an infinite refresh loop which corrupted the
            // pin spacer height calculation, creating the black gap.
            // ─────────────────────────────────────────────────────────
            onRefresh() {
              // Only reset the intro logo position if the animation
              // hasn't started yet (progress === 0 means at the top)
              const trigger = ScrollTrigger.getById('intro-pin')
              if (trigger && trigger.progress < 0.05) {
                const pos = centeredLogoPosition()
                gsap.set(introLogo, { top: pos.top, left: pos.left })
              }
            },
          },
        })

        tl
          // ── Fade out story text ──────────────────────────────────────
          .to('.intro-text', {
            opacity: 0,
            y: isDesktop ? -30 : -20,
            duration: 0.3,
          }, 0)

          // ── Fade out scroll indicator ────────────────────────────────
          .to('.scroll-indicator', { opacity: 0, duration: 0.2 }, 0)

          // ── Fly logo up to navbar ────────────────────────────────────
          //
          // We animate ONLY top, left, fontSize, letterSpacing, color.
          // x/y/xPercent/yPercent stay at 0 (already set in STEP 1).
          // Both start and end values are in px — no unit mismatch.
          // This prevents the "slide + scale" jump seen when mixing
          // CSS %-based transforms with GSAP pixel-based animation.
          // ─────────────────────────────────────────────────────────────
          .to('.intro-logo', {
            duration: 1,
            ease: 'power3.inOut',
            top: () => {
              const r = navLogo.getBoundingClientRect()
              // Vertically centre the intro-logo within the nav bar slot
              return r.top + (r.height - introLogo.offsetHeight) / 2
            },
            left: () => navLogo.getBoundingClientRect().left,
            fontSize: () => window.getComputedStyle(navLogo).fontSize,
            letterSpacing: () => window.getComputedStyle(navLogo).letterSpacing,
            color: 'var(--text)',
          }, 0)

          // ── Atomic swap: show real nav logo, hide intro logo ─────────
          .set(navLogo, { opacity: 1 })
          .set('.intro-logo', { opacity: 0 })

        // ── Hero banner parallax ──────────────────────────────────────
        bannersRef.current.forEach((banner) => {
          if (!banner) return
          const img = banner.querySelector('.hb-image img')
          const content = banner.querySelector('.hb-content')

          if (img) {
            gsap.fromTo(img,
              { scale: 1.15, transformOrigin: 'center top' },
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
              { opacity: 0, y: 50 },
              {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: banner,
                  start: 'top 60%',
                },
              }
            )
          }
        })

        return () => { /* mm.revert() below handles all cleanup */ }
      }
    )

    return () => {
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
