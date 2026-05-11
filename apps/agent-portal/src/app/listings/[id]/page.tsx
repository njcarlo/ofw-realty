'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { AgentSidebar } from '@/components/AgentSidebar'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://ofw-realty-api-production.up.railway.app'
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://ofw-realty-web.vercel.app'

const PROPERTY_TYPES = ['Residential Lot', 'House & Lot', 'Condo', 'Commercial', 'Farm Lot']
const STATUSES = ['active', 'reserved', 'sold', 'deactivated']

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#141414',
  border: '1px solid #1A1A1A',
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 14,
  color: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#595959',
  display: 'block',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    property_type: '',
    price_php: '',
    lot_area_sqm: '',
    city: '',
    province: '',
    barangay: '',
    tct_number: '',
    block_lot: '',
    description: '',
    status: 'active',
  })

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const t = data.session?.access_token
      if (!t) { router.replace('/login'); return }
      setToken(t)

      try {
        const res = await fetch(`${API}/listings/${id}`, {
          headers: { Authorization: `Bearer ${t}` },
        })
        if (res.ok) {
          const listing = await res.json()
          setForm({
            title: listing.title ?? '',
            property_type: listing.property_type ?? '',
            price_php: listing.price_php?.toString() ?? '',
            lot_area_sqm: listing.lot_area_sqm?.toString() ?? '',
            city: listing.city ?? '',
            province: listing.province ?? '',
            barangay: listing.barangay ?? '',
            tct_number: listing.tct_number ?? '',
            block_lot: listing.block_lot ?? '',
            description: listing.description ?? '',
            status: listing.status ?? 'active',
          })
        }
      } catch {
        // listing not found or API unavailable — form stays empty for new entry
      } finally {
        setLoading(false)
      }
    })
  }, [id, router])

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setError('')
    setSaving(true)

    try {
      const body = {
        title: form.title,
        property_type: form.property_type,
        price_php: form.price_php ? parseFloat(form.price_php) : undefined,
        lot_area_sqm: form.lot_area_sqm ? parseFloat(form.lot_area_sqm) : undefined,
        city: form.city,
        province: form.province,
        barangay: form.barangay || undefined,
        tct_number: form.tct_number || undefined,
        block_lot: form.block_lot || undefined,
        description: form.description || undefined,
        status: form.status,
      }

      const res = await fetch(`${API}/listings/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message ?? `Save failed (${res.status})`)
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate() {
    if (!token) return
    if (!confirm('Deactivate this listing? It will be hidden from buyers.')) return
    setSaving(true)
    try {
      await fetch(`${API}/listings/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'deactivated' }),
      })
      router.push('/listings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
        <AgentSidebar />
        <main style={{ flex: 1, padding: 32, color: '#595959', fontSize: 14 }}>Loading listing…</main>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <AgentSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <a href="/listings" style={{ fontSize: 13, color: '#595959', display: 'inline-block', marginBottom: 8 }}>
              ← My Listings
            </a>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Edit Listing</h1>
            <p style={{ fontSize: 13, color: '#595959', margin: '4px 0 0', fontFamily: 'monospace' }}>{id}</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {saved && <span style={{ fontSize: 13, color: '#10B981' }}>✓ Saved</span>}
            <a
              href={`${WEB_URL}/listings/${id}`}
              target="_blank"
              style={{ background: '#0D0D0D', color: '#999', border: '1px solid #1A1A1A', borderRadius: 8, padding: '9px 16px', fontSize: 13 }}
            >
              View Live ↗
            </a>
            <button
              onClick={handleDeactivate}
              disabled={saving}
              style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '9px 16px', fontSize: 13, cursor: 'pointer' }}
            >
              Deactivate
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Title */}
          <div>
            <label style={labelStyle}>Listing Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. House & Lot in Bacoor Cavite"
              style={inputStyle}
              required
            />
          </div>

          {/* Type + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Property Type *</label>
              <select value={form.property_type} onChange={e => set('property_type', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} required>
                <option value="">Select type…</option>
                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {STATUSES.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* Price + Area */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Asking Price (PHP) *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#595959', fontSize: 13 }}>₱</span>
                <input type="number" value={form.price_php} onChange={e => set('price_php', e.target.value)} placeholder="2800000" min={0} style={{ ...inputStyle, paddingLeft: 28 }} required />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Lot Area (sqm)</label>
              <input type="number" value={form.lot_area_sqm} onChange={e => set('lot_area_sqm', e.target.value)} placeholder="120" min={0} style={inputStyle} />
            </div>
          </div>

          {/* Location */}
          <div>
            <label style={labelStyle}>Location *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <input type="text" value={form.city} onChange={e => set('city', e.target.value)} placeholder="City / Municipality" style={inputStyle} required />
              <input type="text" value={form.province} onChange={e => set('province', e.target.value)} placeholder="Province" style={inputStyle} required />
            </div>
            <input type="text" value={form.barangay} onChange={e => set('barangay', e.target.value)} placeholder="Barangay (optional)" style={{ ...inputStyle, marginTop: 10 }} />
          </div>

          {/* TCT + Block/Lot */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>TCT / Tax Declaration No.</label>
              <input type="text" value={form.tct_number} onChange={e => set('tct_number', e.target.value)} placeholder="TCT-123456" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Block / Lot No.</label>
              <input type="text" value={form.block_lot} onChange={e => set('block_lot', e.target.value)} placeholder="Blk 5 Lot 12" style={inputStyle} />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe the property — features, nearby landmarks, financing options…"
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#EF4444' }}>
              {error}
            </div>
          )}

          {/* Save */}
          <div style={{ display: 'flex', gap: 12 }}>
            <a href="/listings" style={{ flex: 1, textAlign: 'center', padding: '12px', background: 'transparent', color: '#595959', border: '1px solid #1A1A1A', borderRadius: 8, fontSize: 14 }}>
              Cancel
            </a>
            <button
              type="submit"
              disabled={saving}
              style={{ flex: 2, padding: '12px', background: saving ? '#333' : '#703BF7', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 0 20px rgba(112,59,247,0.3)' }}
            >
              {saving ? 'Saving…' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
