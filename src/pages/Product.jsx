import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../contexts/CartContext'
import './Product.css'

export default function Product() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [images, setImages] = useState([])
  const [variants, setVariants] = useState([])
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')

  const { addToCart } = useCart()

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true)
        
        // Fetch Product
        const { data: prodData, error: prodError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single()
          
        if (prodError) throw prodError
        setProduct(prodData)

        // Fetch Images
        const { data: imgData, error: imgError } = await supabase
          .from('product_images')
          .select('*')
          .eq('product_id', id)
          .order('display_order', { ascending: true })
          
        if (imgError) throw imgError
        setImages(imgData)

        // Fetch Variants
        const { data: varData, error: varError } = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', id)

        if (varError) throw varError
        setVariants(varData)

        // Auto-select first available variant
        if (varData.length > 0) {
          const available = varData.filter(v => v.stock > 0)
          if (available.length > 0) {
            setSelectedColor(available[0].color)
            setSelectedSize(available[0].size)
          } else {
            setSelectedColor(varData[0].color)
            setSelectedSize(varData[0].size)
          }
        }

      } catch (err) {
        console.error("Error fetching product:", err)
        setError("Product not found")
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  // Compute available colors and sizes
  const colors = useMemo(() => {
    return [...new Set(variants.map(v => v.color))]
  }, [variants])

  const sizesForColor = useMemo(() => {
    if (!selectedColor) return []
    return variants.filter(v => v.color === selectedColor)
  }, [variants, selectedColor])

  const selectedVariant = useMemo(() => {
    return variants.find(v => v.color === selectedColor && v.size === selectedSize)
  }, [variants, selectedColor, selectedSize])

  const handleAddToCart = () => {
    if (!selectedVariant) return
    addToCart(selectedVariant, 1)
  }

  if (loading) return <div className="loading-state">Loading...</div>
  if (error) return <div className="error-state">{error}</div>
  if (!product) return null

  return (
    <div className="product-page">
      <div className="product-container">
        
        {/* Gallery */}
        <div className="product-gallery">
          {images.length > 0 ? (
            images.map(img => (
              <img key={img.id} src={img.image_url} alt={img.alt_text || product.name} />
            ))
          ) : (
            <img src="https://via.placeholder.com/800x1200?text=No+Image" alt="Placeholder" />
          )}
        </div>

        {/* Details */}
        <div className="product-details-container">
          <span className="pd-brand">{product.brand}</span>
          <h1 className="pd-name">{product.name}</h1>
          
          <div className="pd-price-container">
            <span className="pd-final-price">${Number(product.final_price).toFixed(2)}</span>
            {Number(product.discount_percentage) > 0 && (
              <>
                <span className="pd-original-price">${Number(product.original_price).toFixed(2)}</span>
                <span className="pd-discount">{Number(product.discount_percentage)}% OFF</span>
              </>
            )}
          </div>

          <p className="pd-description">{product.description}</p>

          {colors.length > 0 && (
            <div className="pd-variants">
              <h3 className="pd-section-title">Color: {selectedColor}</h3>
              <div className="pd-options">
                {colors.map(color => (
                  <button
                    key={color}
                    className={`pd-option-btn ${selectedColor === color ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedColor(color)
                      // Reset size when color changes to avoid invalid combinations
                      const newSizes = variants.filter(v => v.color === color)
                      if (newSizes.length > 0 && !newSizes.find(s => s.size === selectedSize)) {
                        setSelectedSize(newSizes[0].size)
                      }
                    }}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sizesForColor.length > 0 && (
            <div className="pd-variants">
              <h3 className="pd-section-title">Size</h3>
              <div className="pd-options">
                {sizesForColor.map(v => (
                  <button
                    key={v.size}
                    disabled={v.stock <= 0}
                    className={`pd-option-btn ${selectedSize === v.size ? 'selected' : ''}`}
                    onClick={() => setSelectedSize(v.size)}
                  >
                    {v.size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button 
            className="pd-add-to-cart"
            disabled={variants.length === 0 || !selectedVariant || selectedVariant.stock <= 0}
            onClick={handleAddToCart}
          >
            {variants.length === 0 
              ? 'Currently Unavailable' 
              : !selectedVariant 
                ? 'Select Options' 
                : selectedVariant.stock <= 0 
                  ? 'Out of Stock' 
                  : 'Add to Cart'}
          </button>

          {product.fabric && (
            <div className="pd-fabric">
              <strong>Material:</strong> {product.fabric}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
