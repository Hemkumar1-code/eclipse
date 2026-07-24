/**
 * ECLIPSE — animations.js
 * Global Animation System
 * Lenis Smooth Scroll + GSAP ScrollTrigger
 * Works on all collection, product, and checkout pages
 */

'use strict';

/* ════════════════════════════════════════════════════════════
   LENIS SMOOTH SCROLL
   ════════════════════════════════════════════════════════════ */

function initLenis() {
  if (typeof Lenis === 'undefined') {
    // Retry after CDN load
    setTimeout(initLenis, 100);
    return;
  }

  const lenis = new Lenis({
    duration: 1.3,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    smooth: true,
    mouseMultiplier: 0.8,
    smoothTouch: false,
    touchMultiplier: 1.8,
    infinite: false,
  });

  // Store globally for other scripts
  window.eclipseLenis = lenis;

  // Sync Lenis with GSAP ticker if available
  if (typeof gsap !== 'undefined') {
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    // Fallback RAF loop
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // Pause Lenis when cart drawer is open
  window.addEventListener('cart:drawer-open',  () => lenis.stop());
  window.addEventListener('cart:drawer-close', () => lenis.start());

  // Stop during page transitions
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (link && !link.getAttribute('href').startsWith('#')) {
      setTimeout(() => lenis.stop(), 0);
    }
  });
}

/* ════════════════════════════════════════════════════════════
   GSAP GLOBAL SETUP
   ════════════════════════════════════════════════════════════ */

function initGSAP() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    setTimeout(initGSAP, 100);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Use Lenis scroll position for ScrollTrigger
  if (window.eclipseLenis) {
    window.eclipseLenis.on('scroll', ScrollTrigger.update);
    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value) {
        if (arguments.length) window.eclipseLenis.scrollTo(value, { immediate: true });
        return window.scrollY;
      },
      getBoundingClientRect() {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
      },
      pinType: document.querySelector('body').style.transform ? 'transform' : 'fixed',
    });
  }

  // ── Section reveal animations ──
  initScrollReveal();
  initNavbarScroll();
  initCollectionStoryAnim();
  initProductCardAnim();
  initPageEntrance();
}

/* ════════════════════════════════════════════════════════════
   SCROLL REVEAL — General elements
   ════════════════════════════════════════════════════════════ */

function initScrollReveal() {
  // Standard reveals (already have CSS class system from main.js)
  // Add GSAP-powered reveals for collection/product pages

  const revealItems = document.querySelectorAll('.gsap-reveal');
  revealItems.forEach((el, i) => {
    const delay = parseFloat(el.dataset.delay || 0);
    const from  = el.dataset.from || 'bottom'; // bottom | left | right | scale

    let fromVars = { opacity: 0, y: 36 };
    if (from === 'left')  fromVars = { opacity: 0, x: -36 };
    if (from === 'right') fromVars = { opacity: 0, x:  36 };
    if (from === 'scale') fromVars = { opacity: 0, scale: 0.94 };

    gsap.from(el, {
      ...fromVars,
      duration: 1.1,
      ease: 'power3.out',
      delay,
      scrollTrigger: {
        trigger: el,
        start: 'top 82%',
        once: true,
      },
    });
  });

  // Staggered grid reveals
  const grids = document.querySelectorAll('.pcp-grid, .product-grid');
  grids.forEach(grid => {
    const cards = grid.querySelectorAll('.pcp-card, .product-card');
    gsap.from(cards, {
      opacity: 0,
      y: 48,
      duration: 0.9,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: grid,
        start: 'top 80%',
        once: true,
      },
    });
  });
}

/* ════════════════════════════════════════════════════════════
   NAVBAR — Scroll behavior
   ════════════════════════════════════════════════════════════ */

function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  // Already handled on homepage via main.js
  // For collection/product/checkout pages:
  if (!document.getElementById('intro-screen')) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }, { passive: true });
  }
}

/* ════════════════════════════════════════════════════════════
   COLLECTION STORY ANIMATION
   ════════════════════════════════════════════════════════════ */

function initCollectionStoryAnim() {
  const stories = document.querySelectorAll('.col-story');
  stories.forEach(story => {
    const image   = story.querySelector('.col-story-image');
    const eyebrow = story.querySelector('.col-story-eyebrow');
    const heading = story.querySelector('.col-story-heading');
    const body    = story.querySelector('.col-story-body');
    const stats   = story.querySelectorAll('.col-story-stat-item');

    // Image parallax
    if (image) {
      gsap.to(image.querySelector('img'), {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: {
          trigger: image,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2,
        },
      });
    }

    // Text reveals
    const tl = gsap.timeline({
      scrollTrigger: { trigger: story, start: 'top 70%', once: true },
    });

    if (eyebrow) tl.from(eyebrow, { opacity: 0, y: 16, duration: 0.7, ease: 'power3.out' }, 0);
    if (heading) tl.from(heading, { opacity: 0, y: 28, duration: 0.9, ease: 'power3.out' }, 0.1);
    if (body)    tl.from(body,    { opacity: 0, y: 20, duration: 0.9, ease: 'power3.out' }, 0.2);
    if (stats.length) tl.from(stats, { opacity: 0, y: 16, duration: 0.7, stagger: 0.1, ease: 'power3.out' }, 0.35);
  });
}

/* ════════════════════════════════════════════════════════════
   PRODUCT CARD ANIMATIONS
   ════════════════════════════════════════════════════════════ */

function initProductCardAnim() {
  // Size button selection
  document.querySelectorAll('.pcp-size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.pcp-card');
      card.querySelectorAll('.pcp-size-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');

      // Store selected size on card
      const size = btn.dataset.size;
      card.dataset.selectedSize = size;

      // Pulse animation
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(btn, { scale: 0.9 }, { scale: 1, duration: 0.3, ease: 'back.out(2)' });
      }
    });
  });

  // Color swatch selection
  document.querySelectorAll('.pcp-color').forEach(swatch => {
    swatch.addEventListener('click', () => {
      const card = swatch.closest('.pcp-card');
      card.querySelectorAll('.pcp-color').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      card.dataset.selectedColor = swatch.dataset.color;

      if (typeof gsap !== 'undefined') {
        gsap.fromTo(swatch, { scale: 0.8 }, { scale: 1, duration: 0.35, ease: 'back.out(2)' });
      }
    });
  });

  // Wishlist toggle
  document.querySelectorAll('.pcp-wishlist').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.toggle('active');
      if (typeof gsap !== 'undefined') {
        gsap.timeline()
          .to(btn, { scale: 1.3, duration: 0.15, ease: 'power2.out' })
          .to(btn, { scale: 1,   duration: 0.3,  ease: 'elastic.out(1, 0.5)' });
      }
    });
  });
}

/* ════════════════════════════════════════════════════════════
   PAGE ENTRANCE — fade in from black
   ════════════════════════════════════════════════════════════ */

function initPageEntrance() {
  // Remove transition overlay on page load
  const overlay = document.getElementById('page-transition');
  if (overlay) {
    overlay.classList.remove('entering');
  }

  // Hero parallax on collection pages
  const colHero = document.querySelector('.col-hero-image img');
  if (colHero) {
    gsap.to(colHero, {
      yPercent: 20,
      ease: 'none',
      scrollTrigger: {
        trigger: '.col-hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.2,
      },
    });
  }

  // Section headings split reveal
  const headings = document.querySelectorAll('.col-story-heading, .col-title, .pp-name');
  headings.forEach(h => {
    if (h.classList.contains('col-title')) {
      // Page hero — entrance anim
      gsap.from(h, { opacity: 0, y: 24, duration: 1, ease: 'power3.out', delay: 0.3 });
    }
  });

  // Eyebrow labels
  document.querySelectorAll('.col-eyebrow').forEach(el => {
    if (el.closest('.col-hero-content')) {
      gsap.from(el, { opacity: 0, y: 12, duration: 0.7, ease: 'power3.out', delay: 0.15 });
    }
  });

  // Collection page subtitle
  const colSub = document.querySelector('.col-hero-content .col-subtitle');
  if (colSub) {
    gsap.from(colSub, { opacity: 0, y: 12, duration: 0.7, ease: 'power3.out', delay: 0.5 });
  }

  // Back link
  const colBack = document.querySelector('.col-back');
  if (colBack) {
    gsap.from(colBack, { opacity: 0, x: -16, duration: 0.6, ease: 'power3.out', delay: 0.1 });
  }
}

/* ════════════════════════════════════════════════════════════
   PRODUCT PAGE SPECIFIC
   ════════════════════════════════════════════════════════════ */

function initProductPageAnim() {
  const ppInfo = document.querySelector('.pp-info');
  if (!ppInfo) return;

  // Entrance animation for product info
  const elements = ppInfo.querySelectorAll(
    '.pp-breadcrumb, .pp-category, .pp-name, .pp-tagline, .pp-price-wrap, .pp-section, .pp-cta-row, .pp-accordion, .pp-services'
  );

  gsap.from(elements, {
    opacity: 0,
    y: 24,
    duration: 0.8,
    stagger: 0.06,
    ease: 'power3.out',
    delay: 0.2,
  });

  // Gallery thumbnails
  const thumbs = document.querySelectorAll('.pp-thumb');
  gsap.from(thumbs, {
    opacity: 0,
    y: 10,
    duration: 0.5,
    stagger: 0.08,
    ease: 'power3.out',
    delay: 0.3,
  });

  // Sticky buy button
  const stickyBuy = document.querySelector('.pp-sticky-buy');
  if (stickyBuy) {
    ScrollTrigger.create({
      trigger: '.pp-info',
      start: 'top top',
      onEnter:       () => stickyBuy.classList.add('visible'),
      onLeaveBack:   () => stickyBuy.classList.remove('visible'),
    });
  }

  // Size + Color interactions
  document.querySelectorAll('.pp-size').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('sold-out')) return;
      document.querySelectorAll('.pp-size').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('[data-product-size-display]').forEach(el => {
        el.textContent = btn.dataset.size;
      });
      gsap.fromTo(btn, { scale: 0.88 }, { scale: 1, duration: 0.3, ease: 'back.out(2)' });
    });
  });

  document.querySelectorAll('.pp-color-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      document.querySelectorAll('.pp-color-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      document.querySelectorAll('[data-product-color-display]').forEach(el => {
        el.textContent = swatch.dataset.color;
      });
      gsap.fromTo(swatch, { scale: 0.8 }, { scale: 1, duration: 0.35, ease: 'back.out(2)' });
    });
  });

  // Accordion
  document.querySelectorAll('.pp-accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.parentElement;
      const isOpen = item.classList.contains('open');

      // Close all
      document.querySelectorAll('.pp-accordion-item').forEach(i => i.classList.remove('open'));

      if (!isOpen) {
        item.classList.add('open');
        const body = item.querySelector('.pp-accordion-body');
        gsap.from(body.querySelector('.pp-accordion-content'), {
          opacity: 0, y: 10, duration: 0.4, ease: 'power2.out',
        });
      }
    });
  });

  // Gallery zoom
  const mainImage = document.querySelector('.pp-main-image');
  const zoomOverlay = document.querySelector('.pp-zoom-overlay');
  const zoomClose = document.querySelector('.pp-zoom-close');
  const zoomImg = zoomOverlay?.querySelector('img');

  if (mainImage && zoomOverlay) {
    mainImage.addEventListener('click', () => {
      const src = mainImage.querySelector('img')?.src;
      if (zoomImg && src) zoomImg.src = src;
      zoomOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  }

  if (zoomClose) {
    zoomClose.addEventListener('click', () => {
      zoomOverlay.classList.remove('open');
      document.body.style.overflow = '';
    });
  }

  if (zoomOverlay) {
    zoomOverlay.addEventListener('click', (e) => {
      if (e.target === zoomOverlay) {
        zoomOverlay.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  // Thumbnail switching
  document.querySelectorAll('.pp-thumb').forEach((thumb, i) => {
    thumb.addEventListener('click', () => {
      const src = thumb.querySelector('img').src;
      const label = thumb.dataset.label || '';
      const mainImg = document.querySelector('.pp-main-image img');
      const mainLabel = document.querySelector('.pp-img-label');

      document.querySelectorAll('.pp-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');

      if (mainImg) {
        gsap.to(mainImg, {
          opacity: 0, duration: 0.2, ease: 'power2.in',
          onComplete: () => {
            mainImg.src = src;
            gsap.to(mainImg, { opacity: 1, duration: 0.3, ease: 'power2.out' });
          },
        });
      }

      if (mainLabel) mainLabel.textContent = label;
    });
  });
}

/* ════════════════════════════════════════════════════════════
   CHECKOUT PAGE
   ════════════════════════════════════════════════════════════ */

function initCheckoutAnim() {
  const formSide = document.querySelector('.checkout-form-side');
  if (!formSide) return;

  // Form entrance
  gsap.from(formSide.children, {
    opacity: 0, y: 20,
    duration: 0.7, stagger: 0.08,
    ease: 'power3.out', delay: 0.2,
  });

  // Summary side
  const summaryItems = document.querySelectorAll('.checkout-item');
  gsap.from(summaryItems, {
    opacity: 0, x: 20,
    duration: 0.6, stagger: 0.1,
    ease: 'power3.out', delay: 0.35,
  });

  // Payment method toggle
  document.querySelectorAll('.payment-method').forEach(method => {
    method.addEventListener('click', () => {
      document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('active'));
      method.classList.add('active');
      gsap.fromTo(method, { scale: 0.98 }, { scale: 1, duration: 0.3, ease: 'back.out(1.5)' });
    });
  });

  // Form input focus animations
  document.querySelectorAll('.form-input, .form-select').forEach(input => {
    input.addEventListener('focus', () => {
      gsap.to(input, { borderColor: 'rgba(245,245,245,0.4)', duration: 0.3 });
    });
    input.addEventListener('blur', () => {
      if (!input.value) {
        gsap.to(input, { borderColor: '#1F1F1F', duration: 0.3 });
      }
    });
  });
}

/* ════════════════════════════════════════════════════════════
   INIT — Smart page detection
   ════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // Small delay to let GSAP CDN scripts load
  setTimeout(() => {
    initLenis();
    setTimeout(() => {
      initGSAP();
      initNavbarScroll();

      // Product page
      if (document.querySelector('.pp-layout')) {
        initProductPageAnim();
      }

      // Checkout page
      if (document.querySelector('.checkout-page')) {
        initCheckoutAnim();
      }
    }, 200);
  }, 100);
});
