/**
 * ECLIPSE — cart.js
 * Global Cart Management System
 * Works across ALL pages via localStorage
 * Cart drawer injected into every page
 */

'use strict';

/* ════════════════════════════════════════════════════════════
   PRODUCT DATABASE (simulates CMS)
   ════════════════════════════════════════════════════════════ */
const ECLIPSE_PRODUCTS = {
  'obsidian-tee': {
    id: 'obsidian-tee',
    name: 'Obsidian Oversized Tee',
    category: 'T-Shirts',
    collection: 'Midnight Collection',
    price: 2499,
    originalPrice: null,
    images: {
      front: 'product_tshirt_model.jpg',
      back: 'product_back_view.jpg',
      lifestyle: 'product_lifestyle_outdoor.jpg',
      fabric: 'product_fabric_closeup.jpg',
    },
    colors: [
      { name: 'Carbon Black', hex: '#1a1a1a' },
      { name: 'Off-Black',    hex: '#2d2d2d' },
      { name: 'Washed Black', hex: '#383838' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    soldOut: ['XS'],
    description: 'The Obsidian Tee is built from 340 GSM heavyweight combed cotton — a fabric that demands attention through its weight and drape alone. Constructed with a tubular body for a seamless silhouette, finished with a reinforced crew neck and premium drop-shoulder construction.',
    fabric: '100% Combed Ring-Spun Cotton · 340 GSM · Pre-washed · Pre-shrunk · Tubular construction',
    fit: 'Oversized. Model is 6\'1" and wears size M.',
    page: 'product-obsidian-tee.html',
  },
  'shadow-shirt': {
    id: 'shadow-shirt',
    name: 'Shadow Linen Shirt',
    category: 'Shirts',
    collection: 'Silent Luxury',
    price: 3299,
    originalPrice: null,
    images: {
      front: 'product_shirt_model.jpg',
      back: 'product_back_view.jpg',
      lifestyle: 'product_shirt_lifestyle.jpg',
      fabric: 'product_fabric_closeup.jpg',
    },
    colors: [
      { name: 'Shadow Charcoal', hex: '#3d3d3d' },
      { name: 'Slate Grey',      hex: '#666666' },
      { name: 'Stone',           hex: '#888878' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    soldOut: [],
    description: 'The Shadow Linen Shirt is woven from 100% premium European linen — a fabric that softens with every wash. The relaxed open collar and dropped shoulder seam create an effortless silhouette that moves between the formal and the casual with complete authority.',
    fabric: '100% European Linen · Pre-washed · Enzyme-softened · Relaxed collar · Mother of pearl buttons',
    fit: 'Relaxed. Model is 6\'0" and wears size M.',
    page: 'product-shadow-shirt.html',
  },
  'void-jacket': {
    id: 'void-jacket',
    name: 'Void Structured Jacket',
    category: 'Jackets',
    collection: 'Midnight Collection',
    price: 5999,
    originalPrice: 7499,
    images: {
      front: 'product_new_arrival_1.jpg',
      back: 'product_back_view.jpg',
      lifestyle: 'product_tshirt_model.jpg',
      fabric: 'product_fabric_closeup.jpg',
    },
    colors: [
      { name: 'Obsidian Black', hex: '#111111' },
      { name: 'Dark Navy',      hex: '#1a1f2e' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    soldOut: ['XL'],
    description: 'The Void Jacket is built from a proprietary technical fabric that reads as matte black in daylight and near-invisible in shadow. Structured shoulders, a clean single-button closure, and concealed pockets. This is what luxury looks like without trying.',
    fabric: 'Technical Micro-Twill Blend · Structured shoulder pads · Satin lining · YKK hardware · Dry clean only',
    fit: 'Contemporary. Model is 6\'1" and wears size M.',
    page: 'product-void-jacket.html',
  },
};

/* ════════════════════════════════════════════════════════════
   CART STATE MANAGEMENT
   ════════════════════════════════════════════════════════════ */

class EclipseCart {
  constructor() {
    this.KEY = 'eclipse_cart_v2';
    this.items = this._load();
    this.isOpen = false;
    this._init();
  }

  /* ── Persistence ── */
  _load() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY)) || [];
    } catch {
      return [];
    }
  }

  _save() {
    localStorage.setItem(this.KEY, JSON.stringify(this.items));
  }

  /* ── Item operations ── */
  add(productId, size, color, qty = 1) {
    const product = ECLIPSE_PRODUCTS[productId];
    if (!product) return;

    const key = `${productId}-${size}-${color}`;
    const existing = this.items.find(i => i.key === key);

    if (existing) {
      existing.qty = Math.min(existing.qty + qty, 10);
    } else {
      this.items.push({
        key, productId, size, color, qty,
        name: product.name,
        price: product.price,
        image: product.images.front,
        category: product.category,
      });
    }

    this._save();
    this._emit('cart:updated');
    this._emit('cart:item-added', { productId, size, color });
  }

  remove(key) {
    this.items = this.items.filter(i => i.key !== key);
    this._save();
    this._emit('cart:updated');
  }

  updateQty(key, delta) {
    const item = this.items.find(i => i.key === key);
    if (!item) return;
    item.qty = Math.max(1, Math.min(item.qty + delta, 10));
    this._save();
    this._emit('cart:updated');
  }

  get count()    { return this.items.reduce((s, i) => s + i.qty, 0); }
  get subtotal() { return this.items.reduce((s, i) => s + i.price * i.qty, 0); }
  get isEmpty()  { return this.items.length === 0; }

  /* ── Events ── */
  _emit(name, detail = {}) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  /* ── DOM Injection ── */
  _init() {
    document.addEventListener('DOMContentLoaded', () => {
      this._injectDrawer();
      this._injectToastContainer();
      this._injectPageTransition();
      this._injectScrollProgress();
      this._bindEvents();
      this._updateBadge();
    });
  }

  _injectDrawer() {
    if (document.getElementById('cart-drawer')) return;

    const html = `
      <!-- Cart Backdrop -->
      <div id="cart-backdrop" aria-hidden="true"></div>

      <!-- Cart Drawer -->
      <aside id="cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping cart">
        <div class="cart-drawer-head">
          <div>
            <div class="cart-drawer-title">Your Cart</div>
            <div class="cart-drawer-count" id="cart-drawer-count">0 items</div>
          </div>
          <button class="cart-drawer-close" id="cart-drawer-close" aria-label="Close cart">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="cart-drawer-body" id="cart-drawer-body"></div>
        <div class="cart-drawer-foot" id="cart-drawer-foot">
          <div class="cart-subtotal-row">
            <span class="cart-subtotal-label">Subtotal</span>
            <span class="cart-subtotal-val" id="cart-subtotal">₹0</span>
          </div>
          <div class="cart-shipping-note">Free shipping on orders above <span>₹2,999</span></div>
          <a href="checkout.html" class="cart-checkout-btn" id="cart-checkout-link">
            Proceed to Checkout
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" style="width:16px;height:16px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3"/>
            </svg>
          </a>
          <button class="cart-continue-btn" id="cart-continue">Continue Shopping</button>
        </div>
      </aside>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  }

  _injectToastContainer() {
    if (document.getElementById('toast-container')) return;
    document.body.insertAdjacentHTML('beforeend', '<div id="toast-container"></div>');
  }

  _injectPageTransition() {
    if (document.getElementById('page-transition')) return;
    document.body.insertAdjacentHTML('beforeend', '<div id="page-transition"></div>');
  }

  _injectScrollProgress() {
    if (document.getElementById('scroll-progress')) return;
    document.body.insertAdjacentHTML('afterbegin', '<div id="scroll-progress"></div>');
  }

  _bindEvents() {
    // Drawer open/close
    const closeBtn  = document.getElementById('cart-drawer-close');
    const backdrop  = document.getElementById('cart-backdrop');
    const continueBtn = document.getElementById('cart-continue');

    if (closeBtn)    closeBtn.addEventListener('click', () => this.close());
    if (backdrop)    backdrop.addEventListener('click', () => this.close());
    if (continueBtn) continueBtn.addEventListener('click', () => this.close());

    // Open cart on nav icon click (works across all pages)
    const cartBtn = document.getElementById('cart-btn');
    if (cartBtn) cartBtn.addEventListener('click', () => this.open());

    // Cart icon in product page sticky button etc.
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-open-cart]')) this.open();
    });

    // Cart updates
    window.addEventListener('cart:updated', () => {
      this._updateBadge();
      this._renderItems();
    });

    // Item added — show toast
    window.addEventListener('cart:item-added', (e) => {
      const p = ECLIPSE_PRODUCTS[e.detail.productId];
      if (p) this._toast(`${p.name} added to cart`);
    });

    // Scroll progress
    window.addEventListener('scroll', () => {
      const progress = document.getElementById('scroll-progress');
      if (!progress) return;
      const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      progress.style.width = scrolled + '%';
    }, { passive: true });

    // ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });

    // Page link transitions
    this._bindPageTransitions();

    // Initial render
    this._renderItems();
  }

  _bindPageTransitions() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') ||
          href.startsWith('tel:') || link.hasAttribute('target') ||
          href.startsWith('http') || href.startsWith('javascript')) return;

      e.preventDefault();
      const overlay = document.getElementById('page-transition');
      if (overlay) {
        overlay.classList.add('entering');
        setTimeout(() => { window.location.href = href; }, 380);
      } else {
        window.location.href = href;
      }
    });
  }

  /* ── Drawer open/close ── */
  open() {
    this.isOpen = true;
    const drawer   = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-backdrop');
    if (drawer)   drawer.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Animate items in with GSAP if available
    if (typeof gsap !== 'undefined' && !this.isEmpty) {
      const items = document.querySelectorAll('.cart-item');
      gsap.fromTo(items,
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out', delay: 0.15 }
      );
    }
  }

  close() {
    this.isOpen = false;
    const drawer   = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-backdrop');
    if (drawer)   drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ── Render cart items ── */
  _renderItems() {
    const body  = document.getElementById('cart-drawer-body');
    const count = document.getElementById('cart-drawer-count');
    const sub   = document.getElementById('cart-subtotal');
    if (!body) return;

    if (count) count.textContent = `${this.count} ${this.count === 1 ? 'item' : 'items'}`;
    if (sub)   sub.textContent   = `₹${this.subtotal.toLocaleString('en-IN')}`;

    if (this.isEmpty) {
      body.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"/>
            </svg>
          </div>
          <div class="cart-empty-title">Your Cart is Empty</div>
          <p class="cart-empty-text">Discover our curated collections and find pieces that speak to your identity.</p>
          <a href="collection-midnight.html" class="cart-empty-cta">Explore Collections</a>
        </div>
      `;
      return;
    }

    body.innerHTML = this.items.map(item => `
      <div class="cart-item" data-key="${item.key}">
        <div class="cart-item-image">
          <img src="${item.image}" alt="${item.name}" loading="lazy" onerror="this.src='product_tshirt_model.jpg'" />
        </div>
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-meta">${item.size} · ${item.color}</div>
          <div class="cart-item-price">₹${(item.price).toLocaleString('en-IN')}</div>
          <div class="cart-item-row">
            <div class="cart-qty">
              <button class="cart-qty-btn" data-action="dec" data-key="${item.key}" aria-label="Decrease quantity">−</button>
              <span class="cart-qty-val">${item.qty}</span>
              <button class="cart-qty-btn" data-action="inc" data-key="${item.key}" aria-label="Increase quantity">+</button>
            </div>
            <button class="cart-remove" data-remove="${item.key}" aria-label="Remove ${item.name}">Remove</button>
          </div>
        </div>
      </div>
    `).join('');

    // Bind item controls
    body.querySelectorAll('.cart-qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        const delta = btn.dataset.action === 'inc' ? 1 : -1;
        this.updateQty(key, delta);
      });
    });

    body.querySelectorAll('.cart-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.remove;
        const item = this.items.find(i => i.key === key);

        // GSAP remove animation
        const el = btn.closest('.cart-item');
        if (el && typeof gsap !== 'undefined') {
          gsap.to(el, {
            opacity: 0, x: 40, height: 0, padding: 0,
            duration: 0.4, ease: 'power3.in',
            onComplete: () => this.remove(key)
          });
        } else {
          this.remove(key);
        }
      });
    });
  }

  /* ── Update nav badge ── */
  _updateBadge() {
    const badges = document.querySelectorAll('#cart-count, .cart-badge');
    badges.forEach(b => {
      b.textContent = this.count;
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(b, { scale: 1.5 }, { scale: 1, duration: 0.3, ease: 'back.out(2)' });
      }
    });
  }

  /* ── Toast ── */
  _toast(message, duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<div class="toast-dot"></div><span>${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('visible');
      setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 400);
      }, duration);
    });
  }
}

/* ════════════════════════════════════════════════════════════
   QUICK ADD — binds to all .pcp-add-cart and product page btns
   ════════════════════════════════════════════════════════════ */

function initQuickAddBindings() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add-cart]');
    if (!btn) return;

    const productId = btn.dataset.addCart;
    const size  = btn.dataset.size  || btn.closest('[data-selected-size]')?.dataset.selectedSize || 'M';
    const color = btn.dataset.color || btn.closest('[data-selected-color]')?.dataset.selectedColor || 'Black';

    if (!productId) return;

    // Button feedback
    const original = btn.textContent;
    btn.textContent = '✓ Added';
    btn.classList.add('added', 'adding');
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove('added', 'adding');
    }, 2000);

    window.eclipseCart.add(productId, size, color);

    // Open drawer after short delay
    setTimeout(() => window.eclipseCart.open(), 600);
  });
}

/* ════════════════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════════════════ */

window.eclipseCart = new EclipseCart();
document.addEventListener('DOMContentLoaded', initQuickAddBindings);
