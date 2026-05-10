'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DeveloperSidebar } from '@/components/DeveloperSidebar'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [siteMap, setSiteMap] = useState<File | null>(null)
  const [form, setForm] = useState({
    name: '',
    project_type: 'subdivision',
    province: '',
    city: '',
    barangay: '',
    lat: '',
    lng: '',
    total_units: '',
    video_url: '',
    virtual_tour_url: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (photos.length < 5) {
      setError('Please upload at least 5 photos.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data: s } = await supabase.auth.getSession()
      const token = s.session?.access_token
      if (!token) { router.replace('/onboarding'); return }

      // Upload photos to project-media bucket
      const photoUrls: string[] = []
      for (const photo of photos) {
        const path = `photos/${Date.now()}-${photo.name}`
        const { data, error: uploadErr } = await supabase.storage.from('project-media').upload(path, photo)
        if (uploadErr || !data) continue
        const { data: { publicUrl } } = supabase.storage.from('project-media').getPublicUrl(data.path)
        photoUrls.push(publicUrl)
      }

      // Upload site map if provided
      let siteMapUrl: string | undefined
      if (siteMap) {
        const path = `sitemaps/${Date.now()}-${siteMap.name}`
        const { data } = await supabase.storage.from('project-media').upload(path, siteMap)
        if (data) {
          const { data: { publicUrl } } = supabase.storage.from('project-media').getPublicUrl(data.path)
          siteMapUrl = publicUrl
        }
      }

      const res = await fetch(`${API}/api/projects`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          lat: parseFloat(form.lat),
          lng: parseFloat(form.lng),
          total_units: parseInt(form.total_units),
          photos: photoUrls,
          site_map_url: siteMapUrl,
        }),
      })

      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.message ?? 'Failed to create project.')
        return
      }
      const project = await res.json()
      router.push(`/projects/${project.id}`)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#141414', border: '1px solid #1A1A1A',
    borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#fff',
    outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: '#595959', display: 'block', marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: '0.05em',
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <DeveloperSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <a href="/projects" style={{ color: '#595959', fontSize: 14 }}>← Projects</a>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Create New Project</h1>
        </div>

        <form onSubmit={handleSubmit} style={{ maxWidth: 720 }}>
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 24, marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Project Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Project Name *</label>
                <input type="text" required style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Sunshine Residences" />
              </div>
              <div>
                <label style={labelStyle}>Project Type *</label>
                <select required style={{ ...inputStyle, cursor: 'pointer' }} value={form.project_type} onChange={e => setForm(f => ({ ...f, project_type: e.target.value }))}>
                  <option value="subdivision">Subdivision</option>
                  <option value="condominium">Condominium</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="mixed_use">Mixed Use</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Total Units *</label>
                <input type="number" required min="1" style={inputStyle} value={form.total_units} onChange={e => setForm(f => ({ ...f, total_units: e.target.value }))} placeholder="e.g. 200" />
              </div>
            </div>
          </div>

          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 24, marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Location</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Province *</label>
                <input type="text" required style={inputStyle} value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} placeholder="e.g. Cavite" />
              </div>
              <div>
                <label style={labelStyle}>City / Municipality *</label>
                <input type="text" required style={inputStyle} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="e.g. Bacoor" />
              </div>
              <div>
                <label style={labelStyle}>Barangay</label>
                <input type="text" style={inputStyle} value={form.barangay} onChange={e => setForm(f => ({ ...f, barangay: e.target.value }))} placeholder="e.g. Molino" />
              </div>
              <div />
              <div>
                <label style={labelStyle}>Latitude (GPS) *</label>
                <input type="number" required step="any" style={inputStyle} value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} placeholder="e.g. 14.4791" />
              </div>
              <div>
                <label style={labelStyle}>Longitude (GPS) *</label>
                <input type="number" required step="any" style={inputStyle} value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} placeholder="e.g. 120.9422" />
              </div>
            </div>
          </div>

          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 24, marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Project Media</div>
            <p style={{ fontSize: 13, color: '#595959', marginBottom: 20 }}>Minimum 5 photos required.</p>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Project Photos * (min 5)</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#141414', border: `1px dashed ${photos.length >= 5 ? '#10B981' : '#1A1A1A'}`, borderRadius: 8, padding: '14px 18px', cursor: 'pointer' }}>
                <span style={{ fontSize: 20 }}>📷</span>
                <div>
                  <div style={{ fontSize: 14, color: photos.length >= 5 ? '#10B981' : '#999' }}>
                    {photos.length > 0 ? `${photos.length} photo${photos.length !== 1 ? 's' : ''} selected ${photos.length >= 5 ? '✓' : `(need ${5 - photos.length} more)`}` : 'Click to upload photos'}
                  </div>
                  <div style={{ fontSize: 12, color: '#595959' }}>JPG, PNG, WebP accepted</div>
                </div>
                <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => setPhotos(Array.from(e.target.files ?? []))} />
              </label>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Site Map (optional)</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#141414', border: '1px dashed #1A1A1A', borderRadius: 8, padding: '14px 18px', cursor: 'pointer' }}>
                <span style={{ fontSize: 20 }}>🗺️</span>
                <div>
                  <div style={{ fontSize: 14, color: siteMap ? '#10B981' : '#999' }}>{siteMap ? `${siteMap.name} ✓` : 'Upload site map'}</div>
                  <div style={{ fontSize: 12, color: '#595959' }}>Image or PDF</div>
                </div>
                <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={e => setSiteMap(e.target.files?.[0] ?? null)} />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Video URL (optional)</label>
                <input type="url" style={inputStyle} value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} placeholder="https://youtube.com/..." />
              </div>
              <div>
                <label style={labelStyle}>Virtual Tour URL (optional)</label>
                <input type="url" style={inputStyle} value={form.virtual_tour_url} onChange={e => setForm(f => ({ ...f, virtual_tour_url: e.target.value }))} placeholder="https://matterport.com/..." />
              </div>
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 18 }}>
              <p style={{ fontSize: 13, color: '#EF4444', margin: 0 }}>{error}</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <a href="/projects" style={{ background: '#0D0D0D', color: '#999', border: '1px solid #1A1A1A', borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 500 }}>
              Cancel
            </a>
            <button type="submit" disabled={loading} style={{ background: loading ? '#333' : '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 0 20px rgba(112,59,247,0.3)' }}>
              {loading ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
