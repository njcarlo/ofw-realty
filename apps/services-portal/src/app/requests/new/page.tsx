'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://ofw-realty-api-production.up.railway.app'

const SERVICE_TYPES = [
  { value: 'property_appraisal',       label: 'Property Appraisal' },
  { value: 'geodetic_survey',          label: 'Geodetic Survey' },
  { value: 'title_transfer',           label: 'Title Transfer' },
  { value: 'notarization',             label: 'Notarization' },
  { value: 'legal_consultation',       label: 'Legal Consultation' },
  { value: 'property_tax_assistance',  label: 'Property Tax Assistance' },
  { value: 'building_permit_processing', label: 'Building Permit Processing' },
  { value: 'other',                    label: 'Other' },
]

const PROVINCES = [
  'Metro Manila', 'Cavite', 'Laguna', 'Batangas', 'Rizal', 'Bulacan',
  'Pampanga', 'Cebu', 'Davao del Sur', 'Iloilo', 'Negros Occidental',
  'Cagayan de Oro', 'Zamboanga del Sur', 'Other',
]

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

export default function PostRequestPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    service_type: '',
    other_description: '',
    description: '',
    province: '',
    city: '',
    barangay: '',
    preferred_timeline: '',
    budget_min_php: '',
    budget_max_php: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.service_type) { setError('Please select a service type.'); return }
    if (form.service_type === 'other' && !form.other_description.trim()) {
      setError('Please describe the service you need.'); return
    }
    if (!form.description.trim()) { setError('Please describe the work needed.'); return }
    if (!form.province) { setError('Please select a province.'); return }
    if (!form.city.trim()) { setError('Please enter a city.'); return }

    setSubmitting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const body: Record<string, unknown> = {
        service_type: form.service_type,
        description: form.description,
        province: form.province,
        city: form.city,
        barangay: form.barangay || undefined,
        preferred_timeline: form.preferred_timeline || undefined,
        budget_min_php: form.budget_min_php ? parseFloat(form.budget_min_php) : undefined,
        budget_max_php: form.budget_max_php ? parseFloat(form.budget_max_php) : undefined,
      }
      if (form.service_type === 'other') {
        body.other_description = form.other_description
      }

      const res = await fetch(`${API}/service-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message ?? `Request failed (${res.status})`)
      }

      router.push('/requests?posted=1')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ padding: 32, maxWidth: 680, fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <a href="/requests" style={{ fontSize: 13, color: '#595959', display: 'inline-block', marginBottom: 12 }}>
          ← Back to Requests
        </a>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0 }}>Post a Service Request</h1>
        <p style={{ fontSize: 14, color: '#595959', margin: '6px 0 0' }}>
          Describe what you need and qualified professionals will respond with proposals.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Service Type */}
        <div>
          <label style={labelStyle}>Service Type *</label>
          <select
            value={form.service_type}
            onChange={e => set('service_type', e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
            required
          >
            <option value="">Select a service type…</option>
            {SERVICE_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Other description — only shown when "Other" is selected */}
        {form.service_type === 'other' && (
          <div>
            <label style={labelStyle}>Describe the Service Needed *</label>
            <input
              type="text"
              value={form.other_description}
              onChange={e => set('other_description', e.target.value)}
              placeholder="e.g. Property boundary dispute resolution"
              style={inputStyle}
              required
            />
          </div>
        )}

        {/* Description */}
        <div>
          <label style={labelStyle}>Work Description *</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Describe the work needed, property details, any special requirements…"
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            required
          />
        </div>

        {/* Location */}
        <div>
          <label style={labelStyle}>Property Location *</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <select
              value={form.province}
              onChange={e => set('province', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
              required
            >
              <option value="">Province…</option>
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input
              type="text"
              value={form.city}
              onChange={e => set('city', e.target.value)}
              placeholder="City / Municipality"
              style={inputStyle}
              required
            />
          </div>
          <input
            type="text"
            value={form.barangay}
            onChange={e => set('barangay', e.target.value)}
            placeholder="Barangay (optional)"
            style={{ ...inputStyle, marginTop: 10 }}
          />
        </div>

        {/* Timeline */}
        <div>
          <label style={labelStyle}>Preferred Timeline</label>
          <input
            type="text"
            value={form.preferred_timeline}
            onChange={e => set('preferred_timeline', e.target.value)}
            placeholder="e.g. Within 2 weeks, ASAP, Before June 2026"
            style={inputStyle}
          />
        </div>

        {/* Budget */}
        <div>
          <label style={labelStyle}>Budget Range (PHP) — Optional</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#595959', fontSize: 13 }}>₱</span>
              <input
                type="number"
                value={form.budget_min_php}
                onChange={e => set('budget_min_php', e.target.value)}
                placeholder="Min"
                min={0}
                style={{ ...inputStyle, paddingLeft: 28 }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#595959', fontSize: 13 }}>₱</span>
              <input
                type="number"
                value={form.budget_max_php}
                onChange={e => set('budget_max_php', e.target.value)}
                placeholder="Max"
                min={0}
                style={{ ...inputStyle, paddingLeft: 28 }}
              />
            </div>
          </div>
        </div>

        {/* Info box */}
        <div style={{ background: 'rgba(112,59,247,0.08)', border: '1px solid rgba(112,59,247,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#595959', lineHeight: 1.6 }}>
          📋 Your request will be visible to approved service providers in your area. They can submit proposals within 30 days. You choose who to engage.
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#EF4444' }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
          <a
            href="/requests"
            style={{ flex: 1, textAlign: 'center', padding: '12px', background: 'transparent', color: '#595959', border: '1px solid #1A1A1A', borderRadius: 8, fontSize: 14, fontWeight: 500 }}
          >
            Cancel
          </a>
          <button
            type="submit"
            disabled={submitting}
            style={{
              flex: 2,
              padding: '12px',
              background: submitting ? '#333' : '#703BF7',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: submitting ? 'none' : '0 0 20px rgba(112,59,247,0.3)',
            }}
          >
            {submitting ? 'Posting…' : '📋 Post Request'}
          </button>
        </div>
      </form>
    </div>
  )
}
