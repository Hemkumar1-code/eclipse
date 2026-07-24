import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Collection.css'

export default function Collection() {
  const { slug } = useParams()
  const [collection, setCollection] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchCollectionData() {
      try {
        setLoading(true)
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

        // Process products to easily grab the primary image
        const processedProducts = prodData.map(p => {
          const primaryImage = p.product_images?.find(img => img.is_primary)?.image_url 
                            || p.product_images?.[0]?.image_url
                            || 'https://via.placeholder.com/600x800'
          return { ...p, image: primaryImage }
        })

        setProducts(processedProducts)
      } catch (err) {
        console.error("Error fetching collection:", err)
        setError("Collection not found")
      } finally {
        setLoading(false)
      }
    }
    fetchCollectionData()
  }, [slug])

  if (loading) return <div className="loading-state">Loading...</div>
  if (error) return <div className="error-state">{error}</div>
  if (!collection) return <div className="error-state">Collection Not Found</div>

  return (
    <div className="collection-page">
      <header className="collection-header">
        <h1 className="collection-title">{collection.name}</h1>
        {collection.description && <p className="collection-description">{collection.description}</p>}
      </header>

      <div className="collection-grid">
        {products.map(product => (
          <Link to={`/product/${product.id}`} className="product-card" key={product.id}>
            <div className="product-image-container">
              <img src={product.image} alt={product.name} />
            </div>
            <div className="product-info">
              <span className="product-brand">{product.brand}</span>
              <h3 className="product-name">{product.name}</h3>
              <span className="product-price">${Number(product.final_price).toFixed(2)}</span>
            </div>
          </Link>
        ))}
      </div>
      
      {products.length === 0 && (
        <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No products found in this collection.
        </div>
      )}
    </div>
  )
}
