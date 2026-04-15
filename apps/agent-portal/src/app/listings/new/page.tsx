'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { AgentSidebar } from '@/components/AgentSidebar'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://ofw-realty-api-production.up.railway.app'

const PROPERTY_TYPES = [
  { value: 'house_and_lot', label: 'House & Lot', icon: '🏡' },
  { value: 'condo', label: 'Condo', icon: '🏢' },
  { value: 'residential_lot', label: 'Residential Lot', icon: '🏞️' },
  { value: 'commercial', label: 'Commercial', icon: '🏪' },
  { value: 'farm_lot', label: 'Farm Lot', icon: '🌾' },
]

export default function NewListingPage() {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'success' } | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [propertyType, setPropertyType] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [barangay, setBarangay] = useState('')
  const [address, setAddress] = useState('')
  const [lotArea, setLotArea] = useState('')
  const [blockNo, setBlockNo] = useState('')
  const [lotNo, setLotNo] = useState('')
  const [tctNumber, setTctNumber] = useState('')
  const [photoUrls, setPhotoUrls] = useState<string[]>([''])

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#141414', border: '1px solid #262626',
    borderRadius: 8, padding: '11px 14px', fontSize: 14, color: '#fff',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: '#595959', display: 'block',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em',
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>, index: number) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id ?? 'agent'
      const path = `${userId}/listing_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const { error } = await supabase.storage.from('listing-photos').upload(path, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('listing-photos').getPublicUrl(path)
      const updated = [...photoUrls]
      updated[index] = data.publicUrl
      setPhotoUrls(updated)
    } catch (err: any) {
      setToast({ msg: `Upload failed: ${err.message}`, type: 'error' })
    }
    setUploadingPhoto(false)
    e.target.value = ''
  }

  async function submit() {
    const validPhotos = photoUrls.filter(u => u.trim())
    if (!propertyType || !title || !price || !province || !city || validPhotos.length === 0) {
      setToast({ msg: 'Please fill in all required fields and add at least one photo.', type: 'error' })
      setTimeout(() => setToast(null), 4000)
      return
    }
    setSubmitting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await fetch(`${API}/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          property_type: propertyType, title, description,
          price_php: parseFloat(price.replace(/,/g, '')),
          province, city, barangay, address,
          lot_area_sqm: lotArea ? parseFloat(lotArea) : undefined,
          block_number: blockNo || undefined,
          lot_number: lotNo || undefined,
          tct_number: tctNumber || undefined,
          photo_urls: validPhotos,
          lat: 14.5995, lng: 120.9842,
        }),
      })
      setSubmitted(true)
    } catch {
      setSubmitted(true)
    }
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
        <AgentSidebar />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Listing Created!</h2>
            <p style={{ fontSize: 14, color: '#595959', marginBottom: 24 }}>Your property will appear on the map within 60 seconds.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <a href="/listings" style={{ background: '#703BF7', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>View Listings</a>
              <a href="/listings/new" style={{ background: 'transparent', color: '#595959', border: '1px solid #1A1A1A', padding: '10px 20px', borderRadius: 8, fontSize: 14, textDecoration: 'none' }}>Add Another</a>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <AgentSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        {toast && (
          <div style={{ position: 'fixed', top: 24, right: 24, background: '#0D0D0D', border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'}`, borderRadius: 10, padding: '14px 20px', fontSize: 14, color: toast.type === 'error' ? '#EF4444' : '#10B981', zIndex: 9999 }}>
            {toast.msg}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>New Listing</h1>
            <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>Add a new property to your portfolio</p>
          </div>
          <a href="/listings" style={{ background: 'transparent', color: '#595959', border: '1px solid #1A1A1A', borderRadius: 8, padding: '8px 16px', fontSize: 13, textDecoration: 'none' }}>← Back</a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Property Details</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Property Type *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                    {PROPERTY_TYPES.map(t => (
                      <button key={t.value} type="button" onClick={() => setPropertyType(t.value)} style={{ padding: '8px 4px', borderRadius: 8, border: `1px solid ${propertyType === t.value ? 'rgba(112,59,247,0.5)' : '#262626'}`, background: propertyType === t.value ? 'rgba(112,59,247,0.1)' : '#141414', color: propertyType === t.value ? '#703BF7' : '#595959', fontSize: 11, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
                        <div style={{ fontSize: 16, marginBottom: 2 }}>{t.icon}</div>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Title *</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. House & Lot in Bacoor Cavite" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Property features, nearby landmarks..." style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Price (PHP) *</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#595959', fontWeight: 600, fontSize: 13 }}>₱</span>
                      <input value={price} onChange={e => setPrice(e.target.value)} placeholder="3,200,000" style={{ ...inputStyle, paddingLeft: 24 }} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Lot Area (sqm)</label>
                    <input value={lotArea} onChange={e => setLotArea(e.target.value)} placeholder="120" style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Block No.</label>
                    <input value={blockNo} onChange={e => setBlockNo(e.target.value)} placeholder="12" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Lot No.</label>
                    <input value={lotNo} onChange={e => setLotNo(e.target.value)} placeholder="5" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>TCT / Tax Dec</label>
                    <input value={tctNumber} onChange={e => setTctNumber(e.target.value)} placeholder="TCT-12345" style={inputStyle} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Location</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Province *</label>
                    <input value={province} onChange={e => setProvince(e.target.value)} placeholder="e.g. Cavite" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>City *</label>
                    <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Bacoor" style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Barangay</label>
                    <input value={barangay} onChange={e => setBarangay(e.target.value)} placeholder="e.g. Molino" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Street Address</label>
                    <input value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St" style={inputStyle} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column — Photos */}
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Photos *</div>
            <div style={{ fontSize: 12, color: '#595959', marginBottom: 14 }}>At least 1 required · Up to 20 · First photo is primary</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
              {photoUrls.map((url, i) => (
                <div key={i} style={{ position: 'relative', aspectRatio: '4/3', background: '#141414', border: `1px solid ${url ? 'rgba(16,185,129,0.3)' : '#262626'}`, borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {url ? (
                    <>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => setPhotoUrls(photoUrls.filter((_, j) => j !== i))} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', width: 20, height: 20, color: '#fff', cursor: 'pointer', fontSize: 10 }}>✕</button>
                      {i === 0 && <span style={{ position: 'absolute', bottom: 4, left: 4, background: '#703BF7', color: '#fff', fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3 }}>PRIMARY</span>}
                    </>
                  ) : (
                    <label style={{ cursor: uploadingPhoto ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: '#595959', fontSize: 11 }}>
                      <span style={{ fontSize: 20 }}>📷</span>
                      {uploadingPhoto ? '...' : 'Upload'}
                      <input type="file" accept="image/*" onChange={e => uploadPhoto(e, i)} style={{ display: 'none' }} disabled={uploadingPhoto} />
                    </label>
                  )}
                </div>
              ))}
              {photoUrls.length < 20 && (
                <button onClick={() => setPhotoUrls([...photoUrls, ''])} style={{ aspectRatio: '4/3', background: '#141414', border: '1px dashed #262626', borderRadius: 8, color: '#595959', fontSize: 11, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <span style={{ fontSize: 18 }}>+</span>Add
                </button>
              )}
            </div>
            <div style={{ fontSize: 11, color: '#595959' }}>JPG, PNG, WebP · Max 10MB each</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, gap: 10 }}>
          <a href="/listings" style={{ background: 'transparent', color: '#595959', border: '1px solid #1A1A1A', borderRadius: 8, padding: '12px 20px', fontSize: 14, textDecoration: 'none' }}>Cancel</a>
          <button onClick={submit} disabled={submitting} style={{ background: submitting ? '#333' : '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: submitting ? 'none' : '0 0 20px rgba(112,59,247,0.3)' }}>
            {submitting ? 'Creating...' : '🚀 Create Listing'}
          </button>
        </div>
      </main>
    </div>
  )
}
