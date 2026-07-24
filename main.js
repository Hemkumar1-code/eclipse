/**
 * ECLIPSE — Premium Men's Fashion
 * Main JavaScript: Intro Animation, Navbar, Scroll, Interactions
 */

'use strict';

/* ════════════════════════════════════════════════════════════
   UTILITIES
   ════════════════════════════════════════════════════════════ */

const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function mapRange(val, inMin, inMax, outMin, outMax) {
  return outMin + ((val - inMin) / (inMax - inMin)) * (outMax - outMin);
}

/* ════════════════════════════════════════════════════════════
   DOM REFERENCES
   ════════════════════════════════════════════════════════════ */

const introScreen    = qs('#intro-screen');
const introLogoWrap  = qs('#intro-logo-wrap');
const introLogo      = qs('#intro-logo');
const introDivider   = qs('#intro-divider');
const introStory     = qs('#intro-story');
const scrollHint     = qs('#scroll-hint');

const navbar         = qs('#navbar');
const navLogo        = qs('#nav-logo');
const mainContent    = qs('#main-content');

const hamburger      = qs('#hamburger');
const mobileMenu     = qs('#mobile-menu');

const searchBtn      = qs('#search-btn');
const searchClose    = qs('#search-close');
const searchOverlay  = qs('#search-overlay');
const searchInput    = qs('#search-input');

const cartCount      = qs('#cart-count');
const cartBtn        = qs('#cart-btn');
const wishlistBtn    = qs('#wishlist-btn');

const heroSection    = qs('#hero');
const heroLabel      = qs('.hero-label');
const heroHeading    = qs('.hero-heading');
const heroCta        = qs('.hero-cta');

const arrivalsTrack  = qs('#arrivals-track');
const arrivalsProgress = qs('#arrivals-progress');

const newsletterForm = qs('#newsletter-form');
const newsletterEmail = qs('#newsletter-email');
const newsletterSubmit = qs('#newsletter-submit');

/* ════════════════════════════════════════════════════════════
   STATE
   ════════════════════════════════════════════════════════════ */

let introComplete    = false;
let introAnimating   = false;
let scrollLocked     = true;
let cartItems        = 2;

/* ════════════════════════════════════════════════════════════
   §1 — INTRO SEQUENCE
   Stages:
   1. Logo fades in (instant, already visible via CSS)
   2. Divider expands
   3. Story + scroll hint fade in
   4. User scrolls → story fades out, logo moves to navbar
   ════════════════════════════════════════════════════════════ */

function initIntro() {
  // Stage 1: Trigger divider expansion after a brief pause
  requestAnimationFrame(() => {
    setTimeout(() => {
      introDivider.classList.add('expanded');
    }, 400);

    // Stage 2: Show story text
    setTimeout(() => {
      introStory.classList.add('visible');
    }, 600);

    // Stage 3: Show scroll hint
    setTimeout(() => {
      scrollHint.classList.add('visible');
      enableScrollCapture();
    }, 2000);
  });
}

function enableScrollCapture() {
  // Listen for first scroll
  window.addEventListener('wheel', onFirstScroll, { passive: true, once: true });
  window.addEventListener('touchstart', onFirstTouchStart, { passive: true });
}

let touchStartY = 0;

function onFirstTouchStart(e) {
  touchStartY = e.touches[0].clientY;
  window.addEventListener('touchend', onFirstTouchEnd, { passive: true, once: true });
}

function onFirstTouchEnd(e) {
  const deltaY = touchStartY - e.changedTouches[0].clientY;
  if (deltaY > 20) {
    onFirstScroll();
  } else {
    window.addEventListener('touchstart', onFirstTouchStart, { passive: true, once: true });
  }
}

function onFirstScroll() {
  if (introAnimating || introComplete) return;
  introAnimating = true;

  window.removeEventListener('touchstart', onFirstTouchStart);

  runIntroOutAnimation();
}

function runIntroOutAnimation() {
  // Step 1: Fade out story + divider + scroll hint
  introStory.style.transition   = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
  introStory.style.opacity      = '0';
  introStory.style.transform    = 'translateY(-8px)';

  introDivider.style.transition = 'height 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease';
  introDivider.style.opacity    = '0';
  introDivider.style.height     = '0';

  scrollHint.style.transition   = 'opacity 0.4s ease';
  scrollHint.style.opacity      = '0';

  // Also hide the tagline
  const introTagline = qs('.intro-tagline');
  if (introTagline) {
    introTagline.style.transition = 'opacity 0.4s ease';
    introTagline.style.opacity    = '0';
  }

  // Step 2: After story fades, animate logo to navbar position
  setTimeout(() => {
    animateLogoToNavbar();
  }, 500);
}

function animateLogoToNavbar() {
  // Get the current bounding rect of intro logo
  const introRect = introLogo.getBoundingClientRect();

  // Target: nav logo position
  // We need to show the navbar first to get nav logo position
  navbar.style.opacity = '1';
  navbar.style.pointerEvents = 'none'; // keep non-interactive during anim
  navLogo.style.opacity = '0';
  navLogo.style.fontSize = '0';

  // Force a layout read
  const navLogoTarget = navLogo.getBoundingClientRect();

  // Calculate the transform needed:
  // From intro logo center to nav logo left edge
  const fromCenterX = introRect.left + introRect.width / 2;
  const fromCenterY = introRect.top + introRect.height / 2;

  // Target nav logo approximate position
  const toX = navLogoTarget.left + 16; // approximate final left
  const toY = navLogoTarget.top + navLogoTarget.height / 2;

  // Set intro logo to fixed + animate it
  const currentFontSize = parseFloat(getComputedStyle(introLogo).fontSize);

  // Desired final font size in navbar
  const targetFontSize = window.innerWidth >= 1024 ? 22 : 18;

  // Create a clone for the flight animation
  const flyLogo = document.createElement('div');
  flyLogo.textContent = 'ECLIPSE';
  flyLogo.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1100;
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-weight: 300;
    letter-spacing: 0.35em;
    color: #F5F5F5;
    text-transform: uppercase;
    line-height: 1;
    pointer-events: none;
    will-change: transform, font-size, opacity;
    white-space: nowrap;
    font-size: ${currentFontSize}px;
    transform: translate(${introRect.left}px, ${introRect.top}px);
    transition: transform 0.9s cubic-bezier(0.16, 1, 0.3, 1),
                font-size 0.9s cubic-bezier(0.16, 1, 0.3, 1),
                opacity 0.3s ease 0.7s;
  `;
  document.body.appendChild(flyLogo);

  // Hide original intro logo
  introLogo.style.opacity = '0';

  // Force reflow before starting animation
  flyLogo.getBoundingClientRect();

  // Calculate final nav logo position (left edge aligned)
  const navInner     = qs('.nav-inner');
  const navInnerRect = navInner.getBoundingClientRect();
  const finalX       = navInnerRect.left;
  const finalY       = (parseFloat(getComputedStyle(navbar).height) - targetFontSize) / 2;

  // Animate
  requestAnimationFrame(() => {
    flyLogo.style.transform = `translate(${finalX}px, ${finalY}px)`;
    flyLogo.style.fontSize  = `${targetFontSize}px`;
  });

  // After animation: show real nav logo, remove fly clone, complete intro
  setTimeout(() => {
    navLogo.classList.add('active');
    navbar.classList.add('visible');
    navbar.style.pointerEvents = '';

    flyLogo.style.opacity = '0';

    setTimeout(() => {
      flyLogo.remove();
      completeIntro();
    }, 350);
  }, 950);
}

function completeIntro() {
  introComplete  = true;
  introAnimating = false;
  scrollLocked   = false;

  // Restore body scroll
  document.body.style.overflow = '';

  // Slide intro screen out
  introScreen.style.transition = 'opacity 0.5s ease';
  introScreen.style.opacity    = '0';
  setTimeout(() => {
    introScreen.style.display = 'none';
  }, 600);

  // Animate hero content in
  setTimeout(() => {
    heroSection.classList.add('loaded');
    heroLabel.classList.add('anim-in');
    heroHeading.classList.add('anim-in');
    heroCta.classList.add('anim-in');
  }, 100);

  // Enable scroll events
  initScrollHandlers();
  initScrollReveal();
  initParallax();
  initSmoothScroll();
}

/* ════════════════════════════════════════════════════════════
   §2 — NAVBAR SCROLL BEHAVIOR
   ════════════════════════════════════════════════════════════ */

function initScrollHandlers() {
  let lastScrollY = 0;
  let ticking     = false;

  window.addEventListener('scroll', () => {
    lastScrollY = window.scrollY;
    if (!ticking) {
      requestAnimationFrame(() => {
        handleNavbarScroll(lastScrollY);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

function handleNavbarScroll(scrollY) {
  if (scrollY > 60) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}

/* ════════════════════════════════════════════════════════════
   §3 — SCROLL REVEAL (IntersectionObserver)
   ════════════════════════════════════════════════════════════ */

function initScrollReveal() {
  const revealEls = qsa('.reveal, .reveal-left, .reveal-right, .reveal-scale');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  revealEls.forEach(el => observer.observe(el));
}

/* ════════════════════════════════════════════════════════════
   §4 — MOBILE MENU
   ════════════════════════════════════════════════════════════ */

function initMobileMenu() {
  hamburger.addEventListener('click', toggleMobileMenu);

  // Close on backdrop click
  mobileMenu.addEventListener('click', (e) => {
    if (e.target === mobileMenu) closeMobileMenu();
  });

  // Close on mobile links
  qsa('a', mobileMenu).forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  // ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileMenu();
      closeSearchOverlay();
    }
  });
}

function toggleMobileMenu() {
  const isOpen = mobileMenu.classList.contains('open');
  if (isOpen) {
    closeMobileMenu();
  } else {
    openMobileMenu();
  }
}

function openMobileMenu() {
  mobileMenu.classList.add('open');
  hamburger.classList.add('open');
  hamburger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
  mobileMenu.classList.remove('open');
  hamburger.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

/* ════════════════════════════════════════════════════════════
   §5 — SEARCH OVERLAY
   ════════════════════════════════════════════════════════════ */

function initSearch() {
  searchBtn.addEventListener('click', openSearchOverlay);
  searchClose.addEventListener('click', closeSearchOverlay);

  searchOverlay.addEventListener('click', (e) => {
    if (e.target === searchOverlay) closeSearchOverlay();
  });
}

function openSearchOverlay() {
  searchOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => searchInput.focus(), 300);
}

function closeSearchOverlay() {
  searchOverlay.classList.remove('open');
  document.body.style.overflow = '';
  searchInput.value = '';
}

/* ════════════════════════════════════════════════════════════
   §6 — CART
   ════════════════════════════════════════════════════════════ */

function initCart() {
  cartBtn.addEventListener('click', () => {
    // Cart interaction: bump animation on badge
    cartCount.style.transform = 'scale(1.4)';
    setTimeout(() => {
      cartCount.style.transform = 'scale(1)';
    }, 200);
  });
}

/* ════════════════════════════════════════════════════════════
   §7 — WISHLIST CARDS
   ════════════════════════════════════════════════════════════ */

function initWishlist() {
  qsa('.card-wishlist').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      btn.classList.toggle('active');

      // Pulse animation
      btn.style.transform = 'scale(1.35)';
      setTimeout(() => {
        btn.style.transform = '';
      }, 250);
    });
  });
}

/* ════════════════════════════════════════════════════════════
   §8 — NEW ARRIVALS HORIZONTAL SCROLL PROGRESS
   ════════════════════════════════════════════════════════════ */

function initArrivalsScroll() {
  if (!arrivalsTrack || !arrivalsProgress) return;

  arrivalsTrack.addEventListener('scroll', updateArrivalsProgress, { passive: true });
  updateArrivalsProgress();

  // Touch drag support already native, but add mouse drag for desktop
  let isDown    = false;
  let startX    = 0;
  let scrollLeft = 0;

  arrivalsTrack.addEventListener('mousedown', (e) => {
    isDown     = true;
    startX     = e.pageX - arrivalsTrack.offsetLeft;
    scrollLeft = arrivalsTrack.scrollLeft;
    arrivalsTrack.style.cursor = 'grabbing';
  });

  arrivalsTrack.addEventListener('mouseleave', () => {
    isDown = false;
    arrivalsTrack.style.cursor = '';
  });

  arrivalsTrack.addEventListener('mouseup', () => {
    isDown = false;
    arrivalsTrack.style.cursor = '';
  });

  arrivalsTrack.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x    = e.pageX - arrivalsTrack.offsetLeft;
    const walk = (x - startX) * 1.5;
    arrivalsTrack.scrollLeft = scrollLeft - walk;
  });
}

function updateArrivalsProgress() {
  if (!arrivalsTrack || !arrivalsProgress) return;
  const max     = arrivalsTrack.scrollWidth - arrivalsTrack.clientWidth;
  const current = arrivalsTrack.scrollLeft;
  const pct     = max > 0 ? (current / max) * 100 : 0;
  // Width goes from 25% at start to 100% at end
  arrivalsProgress.style.width = `${25 + (pct * 0.75)}%`;
}

/* ════════════════════════════════════════════════════════════
   §9 — QUICK ADD BUTTONS
   ════════════════════════════════════════════════════════════ */

function initQuickAdd() {
  qsa('.quick-add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const originalText = btn.textContent;

      // Animate button
      btn.textContent = 'Added';
      btn.style.background = 'var(--accent)';
      btn.style.borderColor = 'var(--accent)';

      // Update cart count
      cartItems++;
      cartCount.textContent = cartItems;

      // Badge animation
      cartCount.style.transform = 'scale(1.5)';
      setTimeout(() => {
        cartCount.style.transform = 'scale(1)';
      }, 200);

      // Reset button
      setTimeout(() => {
        btn.textContent   = originalText;
        btn.style.background = '';
        btn.style.borderColor = '';
      }, 1800);
    });
  });
}

/* ════════════════════════════════════════════════════════════
   §10 — NEWSLETTER FORM
   ════════════════════════════════════════════════════════════ */

function initNewsletter() {
  if (!newsletterForm) return;

  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = newsletterEmail.value.trim();
    if (!email || !isValidEmail(email)) {
      shakeElement(newsletterEmail);
      return;
    }

    // Success state
    newsletterSubmit.textContent = 'Subscribed';
    newsletterSubmit.style.background = '#1a1a1a';
    newsletterSubmit.style.color = 'var(--accent)';
    newsletterSubmit.disabled = true;

    newsletterEmail.value = '';
    newsletterEmail.placeholder = 'Welcome to the Eclipse.';
    newsletterEmail.disabled = true;
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function shakeElement(el) {
  el.style.borderColor = 'rgba(196, 106, 43, 0.7)';
  el.style.animation   = 'shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both';

  // Inject shake keyframes if not already there
  if (!qs('#shake-style')) {
    const style = document.createElement('style');
    style.id = 'shake-style';
    style.textContent = `
      @keyframes shake {
        10%, 90% { transform: translateX(-2px); }
        20%, 80% { transform: translateX(4px); }
        30%, 50%, 70% { transform: translateX(-4px); }
        40%, 60% { transform: translateX(4px); }
      }
    `;
    document.head.appendChild(style);
  }

  setTimeout(() => {
    el.style.animation   = '';
    el.style.borderColor = '';
  }, 500);
}

/* ════════════════════════════════════════════════════════════
   §11 — PARALLAX (subtle, performance-safe)
   ════════════════════════════════════════════════════════════ */

function initParallax() {
  const heroImg = qs('.hero-image img');
  if (!heroImg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY    = window.scrollY;
        const heroHeight = heroSection.offsetHeight;

        if (scrollY < heroHeight) {
          const progress = scrollY / heroHeight;
          const offset   = progress * 80; // max 80px parallax
          heroImg.style.transform = `scale(1) translateY(${offset * 0.4}px)`;
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ════════════════════════════════════════════════════════════
   §12 — PRODUCT CARD INTERACTIONS
   ════════════════════════════════════════════════════════════ */

function initProductCards() {
  qsa('.product-card, .arrival-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't navigate if clicking wishlist or quick add
      if (e.target.closest('.card-wishlist') || e.target.closest('.quick-add-btn')) return;
      // Would navigate to product page in a real app
    });
  });
}

/* ════════════════════════════════════════════════════════════
   §13 — SMOOTH ANCHOR SCROLLING
   ════════════════════════════════════════════════════════════ */

function initSmoothScroll() {
  qsa('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#' || !introComplete) return;

      const target = qs(href);
      if (!target) return;

      e.preventDefault();
      const navH   = navbar.offsetHeight;
      const top    = target.getBoundingClientRect().top + window.scrollY - navH - 20;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ════════════════════════════════════════════════════════════
   §14 — MARQUEE — duplicate items for seamless loop
   ════════════════════════════════════════════════════════════ */

function initMarquee() {
  const track = qs('#marquee-track');
  if (!track) return;
  // Items already duplicated in HTML for seamless loop
  // Just ensure correct animation
}

/* ════════════════════════════════════════════════════════════
   §15 — RESIZE HANDLER
   ════════════════════════════════════════════════════════════ */

function initResizeHandler() {
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Close mobile menu on resize to desktop
      if (window.innerWidth >= 1024) {
        closeMobileMenu();
      }
    }, 200);
  });
}

/* ════════════════════════════════════════════════════════════
   §16 — CART BADGE STYLE
   ════════════════════════════════════════════════════════════ */

function initCartBadge() {
  if (cartCount) {
    cartCount.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
  }
}

/* ════════════════════════════════════════════════════════════
   INIT — Entry Point
   ════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // Disable body scroll initially
  document.body.style.overflow = 'hidden';

  // Restore after intro
  const origOverflow = document.body.style.overflow;

  // Initialize all modules
  initIntro();
  initMobileMenu();
  initSearch();
  initCart();
  initWishlist();
  initQuickAdd();
  initArrivalsScroll();
  initNewsletter();
  initProductCards();
  initResizeHandler();
  initCartBadge();
  // Note: initSmoothScroll, initParallax, initScrollHandlers, initScrollReveal
  // are all called inside completeIntro() after the intro animation finishes.
});

