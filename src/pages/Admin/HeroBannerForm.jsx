import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Upload, Loader2 } from 'lucide-react'

export default function HeroBannerForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEditing)
  const [collections, setCollections] = useState([])

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    desktop_image_url: '',
    mobile_image_url: '',
    collection_id: '',
    button_text: '',
    button_link: '',
    alt_text: '',
    display_order: 0,
    is_active: true
  })

  useEffect(() => {
    fetchCollections()
    if (isEditing) {
      fetchBanner()
    }
  }, [id])

  const fetchCollections = async () => {
    const { data } = await supabase.from('collections').select('id, name')
    if (data) setCollections(data)
  }

  const fetchBanner = async () => {
    try {
      const { data, error } = await supabase.from('hero_banners').select('*').eq('id', id).single()
      if (error) throw error
      if (data) {
        setFormData({
          title: data.title || '',
          subtitle: data.subtitle || '',
          desktop_image_url: data.desktop_image_url || '',
          mobile_image_url: data.mobile_image_url || '',
          collection_id: data.collection_id || '',
          button_text: data.button_text || '',
          button_link: data.button_link || '',
          alt_text: data.alt_text || '',
          display_order: data.display_order || 0,
          is_active: data.is_active
        })
      }
    } catch (error) {
      console.error('Error fetching banner:', error)
      alert('Error fetching banner data')
    } finally {
      setFetching(false)
    }
  }

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setLoading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('hero-banners')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('hero-banners')
        .getPublicUrl(filePath)

      setFormData(prev => ({
        ...prev,
        [type]: publicUrl
      }))
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Error uploading image')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        collection_id: formData.collection_id || null, // Handle empty collection
        updated_at: new Date()
      }

      if (isEditing) {
        const { error } = await supabase.from('hero_banners').update(payload).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('hero_banners').insert([payload])
        if (error) throw error
      }
      
      navigate('/admin/hero-banners')
    } catch (error) {
      console.error('Error saving banner:', error)
      alert('Error saving banner: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div style={{ color: '#888' }}>Loading form...</div>

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button 
          onClick={() => navigate('/admin/hero-banners')}
          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ fontSize: '24px', fontWeight: 300, letterSpacing: '0.1em' }}>
          {isEditing ? 'Edit Hero Banner' : 'Add Hero Banner'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Basic Info */}
        <div style={{ backgroundColor: '#0A0A0A', padding: '24px', borderRadius: '8px', border: '1px solid #1F1F1F', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 500, borderBottom: '1px solid #1F1F1F', paddingBottom: '12px', marginBottom: '8px' }}>Content</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Banner Title *</label>
              <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Subtitle</label>
              <input type="text" value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Button Text</label>
              <input type="text" value={formData.button_text} onChange={e => setFormData({...formData, button_text: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Button Link</label>
              <input type="text" value={formData.button_link} onChange={e => setFormData({...formData, button_link: e.target.value})} style={inputStyle} />
            </div>
          </div>
          
          <div>
            <label style={labelStyle}>Link to Collection</label>
            <select value={formData.collection_id} onChange={e => setFormData({...formData, collection_id: e.target.value})} style={inputStyle}>
              <option value="">None</option>
              {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Images */}
        <div style={{ backgroundColor: '#0A0A0A', padding: '24px', borderRadius: '8px', border: '1px solid #1F1F1F', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 500, borderBottom: '1px solid #1F1F1F', paddingBottom: '12px', marginBottom: '8px' }}>Media (Supabase Storage)</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Desktop Image */}
            <div>
              <label style={labelStyle}>Desktop Image *</label>
              <div style={{ border: '1px dashed #333', padding: '20px', borderRadius: '4px', textAlign: 'center', backgroundColor: '#111', position: 'relative', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {formData.desktop_image_url ? (
                  <img src={formData.desktop_image_url} alt="Desktop Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ color: '#888', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <Upload size={24} />
                    <span style={{ fontSize: '12px' }}>Upload Image</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'desktop_image_url')} required={!formData.desktop_image_url} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
              </div>
            </div>

            {/* Mobile Image */}
            <div>
              <label style={labelStyle}>Mobile Image *</label>
              <div style={{ border: '1px dashed #333', padding: '20px', borderRadius: '4px', textAlign: 'center', backgroundColor: '#111', position: 'relative', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {formData.mobile_image_url ? (
                  <img src={formData.mobile_image_url} alt="Mobile Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ color: '#888', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <Upload size={24} />
                    <span style={{ fontSize: '12px' }}>Upload Image</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'mobile_image_url')} required={!formData.mobile_image_url} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
              </div>
            </div>
          </div>
          
          <div>
            <label style={labelStyle}>Alt Text (SEO)</label>
            <input type="text" value={formData.alt_text} onChange={e => setFormData({...formData, alt_text: e.target.value})} style={inputStyle} />
          </div>
        </div>

        {/* Settings */}
        <div style={{ backgroundColor: '#0A0A0A', padding: '24px', borderRadius: '8px', border: '1px solid #1F1F1F', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 500, borderBottom: '1px solid #1F1F1F', paddingBottom: '12px', marginBottom: '8px' }}>Settings</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Display Order</label>
              <input type="number" value={formData.display_order} onChange={e => setFormData({...formData, display_order: parseInt(e.target.value)})} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '24px' }}>
              <input type="checkbox" id="is_active" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} style={{ width: '16px', height: '16px' }} />
              <label htmlFor="is_active" style={{ fontSize: '13px', cursor: 'pointer' }}>Banner is Active</label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <button 
            type="button" 
            onClick={() => navigate('/admin/hero-banners')}
            style={{ padding: '12px 24px', background: 'transparent', border: '1px solid #333', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading}
            style={{ padding: '12px 24px', background: '#fff', border: 'none', color: '#000', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {isEditing ? 'Update Banner' : 'Create Banner'}
          </button>
        </div>
      </form>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: '11px', color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }
const inputStyle = { width: '100%', padding: '12px', backgroundColor: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px', outline: 'none', fontFamily: 'inherit', fontSize: '14px' }
