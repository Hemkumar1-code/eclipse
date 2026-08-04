import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './HomeProducts.css'

/* ─────────────────────────────────────────────
   Skeleton card — shown while data is loading
───────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="hp-card hp-card--skeleton" aria-hidden="true">
      <div className="hp-card__image-wrap">
        <div className="hp-skeleton hp-skeleton--image" />
      </div>
      <div className="hp-card__info">
        <div className="hp-skeleton hp-skeleton--brand" />
        <div className="hp-skeleton hp-skeleton--name" />
        <div className="hp-skeleton hp-skeleton--price" />
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Individual product card
───────────────────────────────────────────── */
function ProductCard({ product }) {
  const hasDiscount =
    product.has_discount && Number(product.discount_percentage) > 0

  return (
    <Link to={`/product/${product.id}`} className="hp-card" aria-label={product.name}>
      <div className="hp-card__image-wrap">
        {/* Badge */}
        {product.is_featured && (
          <span className="hp-card__badge hp-card__badge--featured">Featured</span>
        )}
        {product.is_new && !product.is_featured && (
          <span className="hp-card__badge hp-card__badge--new">New</span>
        )}

        <img
          className="hp-card__image"
          src={product.image || "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='800' viewBox='0 0 600 800'%3E%3Crect width='600' height='800' fill='%23111'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' font-weight='300' letter-spacing='8' fill='%23333'%3EECLIPSE%3C/text%3E%3C/svg%3E"}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='800' viewBox='0 0 600 800'%3E%3Crect width='600' height='800' fill='%23111'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' font-weight='300' letter-spacing='8' fill='%23333'%3EECLIPSE%3C/text%3E%3C/svg%3E";
          }}
          alt={product.name}
          loading="lazy"
        />
      </div>

      <div className="hp-card__info">
        <span className="hp-card__brand">{product.brand}</span>
        <h3 className="hp-card__name">{product.name}</h3>
        <div className="hp-card__price-row">
          {hasDiscount ? (
            <>
              <span className="hp-card__price hp-card__price--final">
                ${Number(product.final_price).toFixed(2)}
              </span>
              <span className="hp-card__price hp-card__price--original">
                ${Number(product.original_price).toFixed(2)}
              </span>
              <span className="hp-card__discount">
                {Number(product.discount_percentage)}% OFF
              </span>
            </>
          ) : (
            <span className="hp-card__price hp-card__price--final">
              ${Number(product.final_price ?? product.original_price).toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

/* ─────────────────────────────────────────────
   A single labelled section (Featured / New Arrivals / Curated)
───────────────────────────────────────────── */
function ProductSection({ title, eyebrow, products, loading }) {
  if (!loading && products.length === 0) return null

  return (
    <section className="hp-section">
      <div className="hp-section__header">
        <p className="hp-section__eyebrow">{eyebrow}</p>
        <h2 className="hp-section__title">{title}</h2>
        <div className="hp-section__rule" aria-hidden="true" />
      </div>

      <div className="hp-grid">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   Main exported component
───────────────────────────────────────────── */
export default function HomeProductSections() {
  const [featured, setFeatured] = useState([])
  const [newArrivals, setNewArrivals] = useState([])
  const [curated, setCurated] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      try {
        /*
         * Single query: all Active products with their primary image.
         * We order by is_featured DESC so featured products sort first,
         * then by created_at DESC (newest first).
         * We cap at 24 so the home page doesn't become a catalogue.
         */
        const { data, error } = await supabase
          .from('products')
          .select(`
            id,
            name,
            brand,
            original_price,
            final_price,
            has_discount,
            discount_percentage,
            is_featured,
            created_at,
            product_images ( image_url, is_primary, display_order )
          `)
          .eq('status', 'Active')
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(24)

        if (error) throw error

        // Resolve primary image for each product
        const withImages = (data || []).map((p) => {
          const sorted = (p.product_images || []).slice().sort(
            (a, b) => (a.display_order ?? 99) - (b.display_order ?? 99)
          )
          const primary =
            sorted.find((img) => img.is_primary)?.image_url ||
            sorted[0]?.image_url ||
            null

          return { ...p, image: primary, product_images: undefined }
        })

        // ── Featured (is_featured = true) ─────────────────────────────
        const featuredProducts = withImages.filter((p) => p.is_featured).slice(0, 8)

        // ── New Arrivals (newest 8, not already in featured) ──────────
        const featuredIds = new Set(featuredProducts.map((p) => p.id))
        const newArrivalProducts = withImages
          .filter((p) => !featuredIds.has(p.id))
          .slice(0, 8)

        // ── Curated collection (any remaining up to 8) ────────────────
        const usedIds = new Set([...featuredIds, ...newArrivalProducts.map((p) => p.id)])
        const curatedProducts = withImages
          .filter((p) => !usedIds.has(p.id))
          .slice(0, 8)

        setFeatured(featuredProducts)
        setNewArrivals(newArrivalProducts)
        setCurated(curatedProducts)
      } catch (err) {
        console.error('[Eclipse] Error fetching home products:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // If there are no products at all and we're not loading, render nothing
  if (
    !loading &&
    featured.length === 0 &&
    newArrivals.length === 0 &&
    curated.length === 0
  ) {
    return null
  }

  return (
    <div className="hp-wrapper">
      <ProductSection
        eyebrow="Handpicked for you"
        title="Featured"
        products={featured}
        loading={loading}
      />
      <ProductSection
        eyebrow="Just arrived"
        title="New Arrivals"
        products={newArrivals}
        loading={loading}
      />
      <ProductSection
        eyebrow="Curated selection"
        title="The Collection"
        products={curated}
        loading={loading}
      />
    </div>
  )
}
