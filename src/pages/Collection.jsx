import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import './Collection.css'

export default function Collection() {
  const { slug } = useParams()
  const [collection, setCollection] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ── Define as a stable callback so the retry button can call it directly ──
  const loadData = useCallback(async () => {
    // If Supabase is not configured, don't make a doomed fetch
    if (!isSupabaseConfigured) {
      setLoading(false)
      setError('Supabase is not configured. Please contact the site administrator.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch collection details
      const { data: collData, error: collError } = await supabase
        .from('collections')
        .select('*')
        .eq('slug', slug)
        .single()

      if (collError) throw collError
      setCollection(collData)

      // Fetch products for this collection including their primary image
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select(`
          id, name, slug, brand, final_price,
          product_images ( image_url, is_primary )
        `)
        .eq('collection_id', collData.id)
        .eq('status', 'Active')

      if (prodError) throw prodError

      // Resolve the primary image for each product
      const processedProducts = (prodData || []).map((p) => {
        const primaryImage =
          p.product_images?.find((img) => img.is_primary)?.image_url ||
          p.product_images?.[0]?.image_url ||
          null
        return { ...p, image: primaryImage }
      })

      setProducts(processedProducts)
    } catch (err) {
      console.error('[Eclipse] Error fetching collection:', err)
      if (err?.code === 'PGRST116') {
        // PostgREST error: no rows returned from .single()
        setError('Collection not found.')
      } else {
        setError('Unable to load this collection. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [slug]) // Re-run when slug changes (user navigates to a different collection)

  useEffect(() => {
    loadData()
  }, [loadData])

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="collection-full-state">
        <div className="collection-full-state__spinner" aria-hidden="true" />
        <p className="collection-full-state__text">Loading Collection…</p>
      </div>
    )
  }

  // ── Error state (with retry) ──────────────────────────────────────────────
  if (error) {
    return (
      <div className="collection-full-state">
        <p className="collection-full-state__text collection-full-state__text--error">
          {error}
        </p>
        {/* Only show Retry when it makes sense (not a Supabase config issue) */}
        {isSupabaseConfigured && (
          <button className="collection-retry-btn" onClick={loadData}>
            Try Again
          </button>
        )}
        <Link to="/" className="collection-retry-btn collection-retry-btn--ghost">
          Back to Home
        </Link>
      </div>
    )
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!collection) {
    return (
      <div className="collection-full-state">
        <p className="collection-full-state__text collection-full-state__text--error">
          Collection not found.
        </p>
        <Link to="/" className="collection-retry-btn collection-retry-btn--ghost">
          Back to Home
        </Link>
      </div>
    )
  }

  // ── Collection page ───────────────────────────────────────────────────────
  return (
    <div className="collection-page">
      <header className="collection-header">
        <h1 className="collection-title">{collection.name}</h1>
        {collection.description && (
          <p className="collection-description">{collection.description}</p>
        )}
      </header>

      <div className="collection-grid">
        {products.map((product) => (
          <Link to={`/product/${product.id}`} className="product-card" key={product.id}>
            <div className="product-image-container">
              <img
                src={product.image || 'https://via.placeholder.com/600x800?text=ECLIPSE'}
                alt={product.name}
                loading="lazy"
              />
            </div>
            <div className="product-info">
              <span className="product-brand">{product.brand}</span>
              <h3 className="product-name">{product.name}</h3>
              <span className="product-price">
                ${Number(product.final_price).toFixed(2)}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {products.length === 0 && (
        <div className="collection-empty">
          No products found in this collection.
        </div>
      )}
    </div>
  )
}
