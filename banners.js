/**
 * ECLIPSE — Hero Banners GSAP Animation Engine
 * Parallax image, text reveal, scale, fade — all scroll-triggered
 * No autoplay. No carousel. Pure scroll-driven cinema.
 */

'use strict';

/* ════════════════════════════════════════════════════════════
   WAIT FOR GSAP + PAGE LOAD
   ════════════════════════════════════════════════════════════ */

function waitForGSAP(callback) {
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    callback();
  } else {
    setTimeout(() => waitForGSAP(callback), 50);
  }
}

/* ════════════════════════════════════════════════════════════
   BANNER DATA
   ════════════════════════════════════════════════════════════ */

const BANNERS = [
  {
    id: 1,
    collection: 'midnight',
    image: 'banner_midnight.jpg',
    fallback: 'hero_editorial.jpg',
  },
  {
    id: 2,
    collection: 'urban',
    image: 'banner_urban.jpg',
    fallback: 'editorial_statement.jpg',
  },
  {
    id: 3,
    collection: 'silent',
    image: 'banner_silent.jpg',
    fallback: 'product_shirt_model.jpg',
  },
  {
    id: 4,
    collection: 'monochrome',
    image: 'banner_monochrome.jpg',
    fallback: 'product_tshirt_model.jpg',
  },
];

/* ════════════════════════════════════════════════════════════
   MAIN INIT
   ════════════════════════════════════════════════════════════ */

function initHeroBanners() {
  waitForGSAP(() => {
    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    const banners = document.querySelectorAll('.hero-banner');
    if (!banners.length) return;

    banners.forEach((banner, i) => {
      const n         = i + 1;
      const imgWrap   = banner.querySelector('.hb-image');
      const img       = imgWrap ? imgWrap.querySelector('img') : null;
      const index     = banner.querySelector(`#hb-index-${n}`);
      const titleInner = banner.querySelector(`#hb-title-inner-${n}`);
      const subtitle  = banner.querySelector(`#hb-subtitle-${n}`);
      const tag       = banner.querySelector(`#hb-tag-${n}`);

      // ── PARALLAX: Image moves 30% of scroll distance ──
      if (imgWrap) {
        gsap.to(imgWrap, {
          yPercent: 18,
          ease: 'none',
          scrollTrigger: {
            trigger: banner,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2,
            invalidateOnRefresh: true,
          },
        });
      }

      // ── IMAGE SCALE ON ENTRY ──
      if (img) {
        gsap.fromTo(
          img,
          { scale: 1.08 },
          {
            scale: 1,
            ease: 'power2.out',
            duration: 1.6,
            scrollTrigger: {
              trigger: banner,
              start: 'top 85%',
              end: 'top 20%',
              once: true,
            },
          }
        );
      }

      // ── TEXT ANIMATIONS: staggered reveal ──
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: banner,
          start: 'top 72%',
          end: 'top 20%',
          once: true,
          // toggleClass for the number line
          onEnter: () => {
            banner.classList.add('hb-active');
          },
        },
      });

      // Collection index label
      if (index) {
        tl.fromTo(
          index,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' },
          0
        );
      }

      // Title — sweeping upward reveal (clip from overflow:hidden parent)
      if (titleInner) {
        tl.fromTo(
          titleInner,
          { y: '110%' },
          {
            y: '0%',
            duration: 1.1,
            ease: 'power4.out',
          },
          0.08
        );
      }

      // Subtitle
      if (subtitle) {
        tl.fromTo(
          subtitle,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
          0.32
        );
      }

      // CTA tag
      if (tag) {
        tl.fromTo(
          tag,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' },
          0.52
        );
      }

      // ── BANNER EXIT: subtle scale + fade as you scroll past ──
      gsap.to(banner, {
        opacity: 0.3,
        scale: 0.97,
        ease: 'none',
        scrollTrigger: {
          trigger: banner,
          start: 'bottom 40%',
          end: 'bottom top',
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });
    });

    // ── REFRESH on images loaded ──
    window.addEventListener('load', () => {
      ScrollTrigger.refresh();
    });
  });
}

/* ════════════════════════════════════════════════════════════
   CLICK HANDLER — Navigate to collection page
   ════════════════════════════════════════════════════════════ */

function initBannerClicks() {
  const banners = document.querySelectorAll('.hero-banner');
  banners.forEach(banner => {
    banner.addEventListener('click', (e) => {
      // Allow default <a> navigation (href already set)
      // But add a short fade-out transition for cinematic feel
      e.preventDefault();
      const href = banner.getAttribute('href');
      if (!href) return;

      // Fade the page out
      document.body.style.transition = 'opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
      document.body.style.opacity = '0';

      setTimeout(() => {
        window.location.href = href;
      }, 460);
    });
  });
}

/* ════════════════════════════════════════════════════════════
   HOOK INTO ECLIPSE INTRO COMPLETE
   ════════════════════════════════════════════════════════════ */

// The banners init should run AFTER the intro animation is done
// We poll for the introComplete flag from main.js
function waitForIntroThenInit() {
  // Check every 200ms until intro is done
  const check = setInterval(() => {
    // introComplete is defined in main.js
    if (typeof introComplete !== 'undefined' && introComplete === true) {
      clearInterval(check);
      initHeroBanners();
      initBannerClicks();
    }
  }, 200);

  // Safety fallback — init anyway after 8s even if intro flag not found
  setTimeout(() => {
    clearInterval(check);
    initHeroBanners();
    initBannerClicks();
  }, 8000);
}

document.addEventListener('DOMContentLoaded', () => {
  waitForIntroThenInit();
});
