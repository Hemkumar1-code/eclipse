import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit2, Trash2, PackageSearch } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function HeroBanners() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_banners')
        .select(`*, collections(name)`)
        .order('display_order', { ascending: true })
      
      if (error) throw error
      setBanners(data || [])
    } catch (error) {
      console.error('Error fetching banners:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return
    
    try {
      const { error } = await supabase.from('hero_banners').delete().eq('id', id)
      if (error) throw error
      fetchBanners()
    } catch (error) {
      console.error('Error deleting banner:', error)
      alert('Failed to delete banner')
    }
  }

  if (loading) return <div style={{ color: '#888' }}>Loading banners...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 300, letterSpacing: '0.1em' }}>Hero Banners</h2>
        <button 
          onClick={() => navigate('/admin/hero-banners/new')}
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
          Add Hero Banner
        </button>
      </div>

      {banners.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px', border: '1px dashed #333', borderRadius: '8px', color: '#888' }}>
          No hero banners found. Add one to get started.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {banners.map(banner => (
            <div key={banner.id} style={{ backgroundColor: '#0A0A0A', border: '1px solid #1F1F1F', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ height: '200px', backgroundColor: '#111', position: 'relative' }}>
                <img src={banner.desktop_image_url || banner.mobile_image_url} alt={banner.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px' }}>
                  <span style={{ backgroundColor: banner.is_active ? '#00c853' : '#ff3d00', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>
                    {banner.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 400, marginBottom: '4px' }}>{banner.title}</h3>
                    <p style={{ color: '#888', fontSize: '12px' }}>{banner.collections?.name || 'No Collection'}</p>
                  </div>
                  <div style={{ backgroundColor: '#1F1F1F', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: '#ccc' }}>
                    Order: {banner.display_order}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
                  <button style={{ flex: 1, backgroundColor: '#1A1A1A', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', transition: 'background 0.2s' }}>
                    <PackageSearch size={14} />
                    Products
                  </button>
                  <button onClick={() => navigate(`/admin/hero-banners/${banner.id}`)} style={{ backgroundColor: '#1A1A1A', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: '4px', cursor: 'pointer', transition: 'background 0.2s' }}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(banner.id)} style={{ backgroundColor: 'rgba(255, 61, 0, 0.1)', border: '1px solid rgba(255, 61, 0, 0.3)', color: '#ff3d00', padding: '10px', borderRadius: '4px', cursor: 'pointer', transition: 'background 0.2s' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
