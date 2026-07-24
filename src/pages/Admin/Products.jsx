import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          slug,
          original_price,
          has_discount,
          discount_percentage,
          status,
          collections(name),
          product_images(image_url),
          product_variants(stock)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // Calculate derived fields (total stock, final price, primary image)
      const formatted = (data || []).map(p => {
        const totalStock = p.product_variants?.reduce((acc, v) => acc + v.stock, 0) || 0
        const finalPrice = p.has_discount 
          ? p.original_price - (p.original_price * (p.discount_percentage / 100))
          : p.original_price
        
        return {
          ...p,
          totalStock,
          finalPrice,
          primaryImage: p.product_images?.[0]?.image_url || null
        }
      })
      
      setProducts(formatted)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product? This will also delete all its variants and images.')) return
    
    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product')
    }
  }

  if (loading) return <div style={{ color: '#888' }}>Loading products...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 300, letterSpacing: '0.1em' }}>Products</h2>
        <button 
          onClick={() => navigate('/admin/products/new')}
          style={{ 
            backgroundColor: '#fff', 
            color: '#000', 
            border: 'none', 
            padding: '12px 24px', 
            borderRadius: '4px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      <div style={{ backgroundColor: '#0A0A0A', border: '1px solid #1F1F1F', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1F1F1F', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <th style={{ padding: '16px 24px', fontWeight: 500 }}>Product</th>
              <th style={{ padding: '16px 24px', fontWeight: 500 }}>Collection</th>
              <th style={{ padding: '16px 24px', fontWeight: 500 }}>Stock</th>
              <th style={{ padding: '16px 24px', fontWeight: 500 }}>Price</th>
              <th style={{ padding: '16px 24px', fontWeight: 500 }}>Status</th>
              <th style={{ padding: '16px 24px', fontWeight: 500, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#888' }}>No products found.</td>
              </tr>
            ) : (
              products.map(product => (
                <tr key={product.id} style={{ borderBottom: '1px solid #1F1F1F' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '64px', backgroundColor: '#111', borderRadius: '4px', overflow: 'hidden' }}>
                        {product.primaryImage ? (
                          <img src={product.primaryImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : null}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, marginBottom: '4px' }}>{product.name}</div>
                        <div style={{ color: '#888', fontSize: '11px' }}>{product.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', color: '#888' }}>
                    {product.collections?.name || 'Uncategorized'}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ color: product.totalStock > 0 ? '#fff' : '#ff3d00' }}>
                      {product.totalStock} in stock
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div>₹{product.finalPrice.toFixed(2)}</div>
                    {product.has_discount && (
                      <div style={{ color: '#888', fontSize: '11px', textDecoration: 'line-through' }}>
                        ₹{product.original_price} (-{product.discount_percentage}%)
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '11px', 
                      fontWeight: 600, 
                      textTransform: 'uppercase',
                      backgroundColor: product.status === 'Active' ? 'rgba(0,200,83,0.1)' : 'rgba(255,255,255,0.1)',
                      color: product.status === 'Active' ? '#00c853' : '#888'
                    }}>
                      {product.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button onClick={() => navigate(`/admin/products/${product.id}`)} style={{ backgroundColor: 'transparent', border: '1px solid #333', color: '#fff', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(product.id)} style={{ backgroundColor: 'transparent', border: '1px solid #333', color: '#ff3d00', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
