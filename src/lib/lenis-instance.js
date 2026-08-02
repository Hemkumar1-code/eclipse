/**
 * Module-level Lenis instance reference.
 *
 * Lenis is created and destroyed inside App.jsx's useEffect on every
 * pathname change. Other components (Navbar) need to call programmatic
 * smooth scrolls without importing Lenis or accessing App's local state.
 *
 * This module provides a stable, shared reference so those components
 * can call scrollToSection() regardless of where they live in the tree.
 *
 * IMPORTANT: Never import the raw _lenis reference outside this file.
 * Always use the exported helpers below.
 */

let _lenis = null

/**
 * Called by App.jsx each time a new Lenis instance is created.
 * Also called with `null` in the useEffect cleanup to avoid stale refs.
 * @param {import('@studio-freight/lenis').default | null} instance
 */
export function setLenisInstance(instance) {
  _lenis = instance
}

/**
 * Programmatically scroll to a section by its DOM element ID.
 *
 * Prefers Lenis for smooth, eased scrolling (same easing as the rest of
 * the site). Falls back to native scrollIntoView when Lenis is not yet
 * initialised (e.g., first frame after a route change).
 *
 * On mobile, Lenis has `smoothTouch: false`, so native touch scroll is
 * used for user-initiated drag. Programmatic `lenis.scrollTo()` still
 * works on mobile — it uses JS-driven animation rather than touch events.
 *
 * @param {string} id - The element's `id` attribute (without the `#` prefix)
 */
export function scrollToSection(id) {
  const el = document.getElementById(id)
  if (!el) return

  if (_lenis) {
    _lenis.scrollTo(el, {
      duration: 1.4,
      // Same luxury easing used throughout the site (App.jsx Lenis config)
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })
  } else {
    // Lenis not yet ready — use native smooth scroll
    el.scrollIntoView({ behavior: 'smooth' })
  }
}
