import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Upload, Loader2, Plus, Trash2 } from 'lucide-react'

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEditing)
  
  const [collections, setCollections] = useState([])
  const [categories, setCategories] = useState([])

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    seo_title: '',
    seo_description: '',
    meta_keywords: '',
    category_id: '',
    collection_id: '',
    brand: 'ECLIPSE',
    fabric: '',
    original_price: 0,
    has_discount: false,
    discount_percentage: 0,
    status: 'Draft',
    is_featured: false
  })

  const [variants, setVariants] = useState([])
  const [images, setImages] = useState([])
  const [newImages, setNewImages] = useState([]) // Files waiting to be uploaded

  useEffect(() => {
    fetchMetadata()
    if (isEditing) {
      fetchProduct()
    }
  }, [id])

  const fetchMetadata = async () => {
    const [cols, cats] = await Promise.all([
      supabase.from('collections').select('id, name'),
      supabase.from('categories').select('id, name')
    ])
    if (cols.data) setCollections(cols.data)
    if (cats.data) setCategories(cats.data)
  }

  const fetchProduct = async () => {
    try {
      const { data: p, error } = await supabase
        .from('products')
        .select(`*, product_variants(*), product_images(*)`)
        .eq('id', id)
        .single()
      
      if (error) throw error
      if (p) {
        setFormData({
          name: p.name, slug: p.slug, description: p.description || '', seo_title: p.seo_title || '',
          seo_description: p.seo_description || '', meta_keywords: p.meta_keywords || '',
          category_id: p.category_id || '', collection_id: p.collection_id || '', brand: p.brand || '',
          fabric: p.fabric || '', original_price: p.original_price, has_discount: p.has_discount,
          discount_percentage: p.discount_percentage, status: p.status, is_featured: p.is_featured
        })
        setVariants(p.product_variants || [])
        setImages(p.product_images?.sort((a,b) => a.display_order - b.display_order) || [])
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      alert('Error fetching product data')
    } finally {
      setFetching(false)
    }
  }

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    setNewImages(prev => [...prev, ...files])
  }

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = async (imgId) => {
    if (!window.confirm('Delete this image?')) return
    try {
      await supabase.from('product_images').delete().eq('id', imgId)
      setImages(prev => prev.filter(img => img.id !== imgId))
    } catch (e) {
      console.error(e)
    }
  }

  const addVariant = () => {
    setVariants(prev => [...prev, { size: '', color: '', sku: '', stock: 0, price_override: '', barcode: '', isNew: true }])
  }

  const updateVariant = (index, field, value) => {
    setVariants(prev => {
      const updated = [...prev]
      updated[index][field] = value
      return updated
    })
  }

  const removeVariant = async (index, variantId) => {
    if (variantId) {
      if (!window.confirm('Delete this variant permanently?')) return
      await supabase.from('product_variants').delete().eq('id', variantId)
    }
    setVariants(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        category_id: formData.category_id || null,
        collection_id: formData.collection_id || null,
        updated_at: new Date()
      }

      let productId = id

      if (isEditing) {
        const { error } = await supabase.from('products').update(payload).eq('id', productId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('products').insert([payload]).select().single()
        if (error) throw error
        productId = data.id
      }

      // Upload new images
      for (const file of newImages) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${productId}/${Math.random()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file)
        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName)
        
        await supabase.from('product_images').insert([{
          product_id: productId,
          image_url: publicUrl,
          display_order: images.length,
          is_primary: images.length === 0 && newImages.indexOf(file) === 0
        }])
      }

      // Upsert Variants
      for (const v of variants) {
        const vPayload = {
          product_id: productId,
          size: v.size,
          color: v.color,
          sku: v.sku,
          stock: parseInt(v.stock) || 0,
          price_override: v.price_override || null,
          barcode: v.barcode || null
        }
        if (v.id && !v.isNew) {
          await supabase.from('product_variants').update(vPayload).eq('id', v.id)
        } else {
          await supabase.from('product_variants').insert([vPayload])
        }
      }

      navigate('/admin/products')
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Error saving product: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const finalPrice = formData.has_discount 
    ? formData.original_price - (formData.original_price * (formData.discount_percentage / 100))
    : formData.original_price

  if (fetching) return <div style={{ color: '#888' }}>Loading form...</div>

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button 
          onClick={() => navigate('/admin/products')}
          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ fontSize: '24px', fontWeight: 300, letterSpacing: '0.1em' }}>
          {isEditing ? 'Edit Product' : 'Add Product'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Basic Info */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Basic Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Product Name *</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>URL Slug *</label>
              <input required type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{...inputStyle, height: '100px', resize: 'vertical'}} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Brand</label>
              <input type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} style={inputStyle}>
                <option value="">None</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Collection</label>
              <select value={formData.collection_id} onChange={e => setFormData({...formData, collection_id: e.target.value})} style={inputStyle}>
                <option value="">None</option>
                {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Pricing</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', alignItems: 'end' }}>
            <div>
              <label style={labelStyle}>Original Price (₹) *</label>
              <input required type="number" min="0" step="0.01" value={formData.original_price} onChange={e => setFormData({...formData, original_price: parseFloat(e.target.value) || 0})} style={inputStyle} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <input type="checkbox" id="has_discount" checked={formData.has_discount} onChange={e => setFormData({...formData, has_discount: e.target.checked})} />
                <label htmlFor="has_discount" style={labelStyle}>Enable Discount</label>
              </div>
              {formData.has_discount && (
                <div style={{ position: 'relative' }}>
                  <input type="number" min="0" max="100" value={formData.discount_percentage} onChange={e => setFormData({...formData, discount_percentage: parseFloat(e.target.value) || 0})} style={inputStyle} />
                  <span style={{ position: 'absolute', right: '12px', top: '12px', color: '#888' }}>%</span>
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Final Price (Auto-calculated)</label>
              <div style={{ padding: '12px', backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '4px', color: '#00c853', fontWeight: 600 }}>
                ₹{finalPrice.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Variants */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1F1F1F', paddingBottom: '12px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 500 }}>Variants & Inventory</h3>
            <button type="button" onClick={addVariant} style={{ background: 'none', border: '1px solid #333', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Plus size={12} /> Add Variant
            </button>
          </div>
          
          {variants.length === 0 ? (
            <div style={{ color: '#888', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No variants added.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {variants.map((v, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '12px', alignItems: 'center', backgroundColor: '#111', padding: '12px', borderRadius: '4px', border: '1px solid #1F1F1F' }}>
                  <input placeholder="Size (e.g. M)" value={v.size} onChange={e => updateVariant(index, 'size', e.target.value)} style={inputStyle} required />
                  <input placeholder="Color" value={v.color} onChange={e => updateVariant(index, 'color', e.target.value)} style={inputStyle} required />
                  <input placeholder="SKU" value={v.sku} onChange={e => updateVariant(index, 'sku', e.target.value)} style={inputStyle} required />
                  <input placeholder="Stock" type="number" value={v.stock} onChange={e => updateVariant(index, 'stock', e.target.value)} style={inputStyle} required />
                  <button type="button" onClick={() => removeVariant(index, v.id)} style={{ background: 'none', border: 'none', color: '#ff3d00', cursor: 'pointer', padding: '8px' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Images */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Product Images</h3>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {/* Existing Images */}
            {images.map((img) => (
              <div key={img.id} style={{ position: 'relative', width: '100px', height: '130px', border: '1px solid #333', borderRadius: '4px', overflow: 'hidden' }}>
                <img src={img.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Product" />
                <button type="button" onClick={() => removeExistingImage(img.id)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            
            {/* New Images */}
            {newImages.map((file, i) => (
              <div key={i} style={{ position: 'relative', width: '100px', height: '130px', border: '1px dashed #00c853', borderRadius: '4px', overflow: 'hidden' }}>
                <img src={URL.createObjectURL(file)} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} alt="New Upload" />
                <button type="button" onClick={() => removeNewImage(i)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            <label style={{ width: '100px', height: '130px', border: '1px dashed #333', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#888' }}>
              <Upload size={20} style={{ marginBottom: '8px' }} />
              <span style={{ fontSize: '10px', textTransform: 'uppercase' }}>Upload</span>
              <input type="file" multiple accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {/* Settings & SEO */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>SEO & Settings</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>SEO Title</label>
              <input type="text" value={formData.seo_title} onChange={e => setFormData({...formData, seo_title: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Meta Keywords</label>
              <input type="text" value={formData.meta_keywords} onChange={e => setFormData({...formData, meta_keywords: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={inputStyle}>
                <option value="Draft">Draft</option>
                <option value="Active">Active</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '24px' }}>
              <input type="checkbox" id="is_featured" checked={formData.is_featured} onChange={e => setFormData({...formData, is_featured: e.target.checked})} />
              <label htmlFor="is_featured" style={labelStyle}>Feature this product on homepage</label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginBottom: '64px' }}>
          <button type="button" onClick={() => navigate('/admin/products')} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid #333', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ padding: '12px 24px', background: '#fff', border: 'none', color: '#000', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            {isEditing ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  )
}

const sectionStyle = { backgroundColor: '#0A0A0A', padding: '24px', borderRadius: '8px', border: '1px solid #1F1F1F', display: 'flex', flexDirection: 'column', gap: '16px' }
const sectionTitleStyle = { fontSize: '16px', fontWeight: 500, borderBottom: '1px solid #1F1F1F', paddingBottom: '12px', marginBottom: '8px' }
const labelStyle = { display: 'block', fontSize: '11px', color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }
const inputStyle = { width: '100%', padding: '12px', backgroundColor: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px', outline: 'none', fontFamily: 'inherit', fontSize: '14px' }
