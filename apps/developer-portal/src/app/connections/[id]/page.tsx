'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DeveloperSidebar } from '@/components/DeveloperSidebar'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export default function ConnectionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [token, setToken] = useState<string | null>(null)
  const [connection, setConnection] = useState<any>(null)
  const [rate, setRate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    rate_type: 'percentage',
    rate_value: '',
    promo_rate_type: 'percentage',
    promo_rate_value: '',
    promo_start: '',
    promo_end: '',
  })

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const t = data.session?.access_token
      if (!t) { router.replace('/onboarding'); return }
      setToken(t)
      const [cRes, rRes] = await Promise.all([
        fetch(`${API}/api/broker-connections/${id}`, { headers: { Authorization: `Bearer ${t}` } }),
        fetch(`${API}/api/commission-rates/${id}`, { headers: { Authorization: `Bearer ${t}` } }),
      ])
      if (cRes.ok) setConnection(await cRes.json())
      if (rRes.ok) {
        const r = await rRes.json()
        setRate(r)
        setForm(f => ({
          ...f,
          rate_type: r.rate_type ?? 'percentage',
          rate_value: r.rate_value?.toString() ?? '',
          promo_rate_type: r.promo_rate_type ?? 'percentage',
          promo_rate_value: r.promo_rate_value?.toString() ?? '',
          promo_start: r.promo_start ?? '',
          promo_end: r.promo_end ?? '',
        }))
      }
      setLoading(false)
    })
  }, [id, router])

  async function handleSave() {
    if (!token) return
    setSaving(true)
    try {
      await fetch(`${API}/api/commission-rates`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connection_id: id,
          rate_type: form.rate_type,
          rate_value: parseFloat(form.rate_value),
        }),
      })
      if (form.promo_rate_value && form.promo_start && form.promo_end) {
        await fetch(`${API}/api/commission-rates/promo`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            connection_id: id,
            rate_type: form.promo_rate_type,
            rate_value: parseFloat(form.promo_rate_value),
            promo_start: form.promo_start,
            promo_end: form.promo_end,
          }),
        })
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  // Compute applicable rate preview
  const today = new Date().toISOString().split('T')[0]
  const isPromoActive = form.promo_start && form.promo_end && today >= form.promo_start && today <= form.promo_end
  const applicableRate = isPromoActive
    ? { type: form.promo_rate_type, value: form.promo_rate_value, label: 'Promotional Rate (active)' }
    : { type: form.rate_type, value: form.rate_value, label: 'Standard Rate' }

  const inputStyle: React.CSSProperties = {
    background: '#141414', border: '1px solid #1A1A1A', borderRadius: 8,
    padding: '10px 14px', fontSize: 14, color: '#fff', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: '#595959', display: 'block', marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: '0.05em',
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
        <DeveloperSidebar />
        <main style={{ flex: 1, padding: 32, color: '#595959', fontSize: 14 }}>Loading…</main>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <DeveloperSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <a href="/connections" style={{ fontSize: 13, color: '#595959' }}>← Broker Network</a>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '6px 0 4px' }}>
              {connection?.broker_name ?? 'Broker Connection'}
            </h1>
            <p style={{ fontSize: 14, color: '#595959', margin: 0 }}>Commission rate configuration</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {saved && <span style={{ fontSize: 13, color: '#10B981' }}>✓ Saved</span>}
            <button
              onClick={handleSave} disabled={saving}
              style={{ background: saving ? '#333' : '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 0 20px rgba(112,59,247,0.3)' }}
            >
              {saving ? 'Saving…' : 'Save Commission Rates'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Standard rate */}
            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Standard Commission Rate</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Rate Type</label>
                  <select style={{ ...inputStyle, width: '100%', cursor: 'pointer' }} value={form.rate_type} onChange={e => setForm(f => ({ ...f, rate_type: e.target.value }))}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_php">Fixed Amount (PHP)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Rate Value *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number" min="0.01" step="0.01" required
                      style={{ ...inputStyle, width: '100%', paddingRight: 40 }}
                      value={form.rate_value}
                      onChange={e => setForm(f => ({ ...f, rate_value: e.target.value }))}
                      placeholder={form.rate_type === 'percentage' ? 'e.g. 3' : 'e.g. 50000'}
                    />
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#595959' }}>
                      {form.rate_type === 'percentage' ? '%' : '₱'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Promotional rate */}
            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Promotional Rate (Optional)</div>
              <p style={{ fontSize: 13, color: '#595959', marginBottom: 20 }}>Set a higher rate for a limited time period. Automatically reverts to standard rate after the end date.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Promo Rate Type</label>
                  <select style={{ ...inputStyle, width: '100%', cursor: 'pointer' }} value={form.promo_rate_type} onChange={e => setForm(f => ({ ...f, promo_rate_type: e.target.value }))}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_php">Fixed Amount (PHP)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Promo Rate Value</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number" min="0.01" step="0.01"
                      style={{ ...inputStyle, width: '100%', paddingRight: 40 }}
                      value={form.promo_rate_value}
                      onChange={e => setForm(f => ({ ...f, promo_rate_value: e.target.value }))}
                      placeholder={form.promo_rate_type === 'percentage' ? 'e.g. 5' : 'e.g. 75000'}
                    />
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#595959' }}>
                      {form.promo_rate_type === 'percentage' ? '%' : '₱'}
                    </span>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Promo Start Date</label>
                  <input type="date" style={{ ...inputStyle, width: '100%' }} value={form.promo_start} onChange={e => setForm(f => ({ ...f, promo_start: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Promo End Date</label>
                  <input type="date" style={{ ...inputStyle, width: '100%' }} value={form.promo_end} onChange={e => setForm(f => ({ ...f, promo_end: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>

          {/* Applicable rate preview */}
          <div>
            <div style={{ background: '#0D0D0D', border: `1px solid ${isPromoActive ? 'rgba(245,158,11,0.3)' : 'rgba(112,59,247,0.2)'}`, borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Applicable Rate Today</div>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 48, fontWeight: 800, color: isPromoActive ? '#F59E0B' : '#703BF7' }}>
                  {applicableRate.value || '—'}{applicableRate.type === 'percentage' ? '%' : ''}
                </div>
                {applicableRate.type === 'fixed_php' && applicableRate.value && (
                  <div style={{ fontSize: 16, color: '#595959', marginTop: 4 }}>₱{Number(applicableRate.value).toLocaleString()}</div>
                )}
                <div style={{ fontSize: 13, color: isPromoActive ? '#F59E0B' : '#595959', marginTop: 8 }}>{applicableRate.label}</div>
              </div>
              {isPromoActive && (
                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8, padding: '10px 14px', marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: '#F59E0B' }}>🎯 Promo active: {form.promo_start} → {form.promo_end}</div>
                  <div style={{ fontSize: 12, color: '#595959', marginTop: 4 }}>Standard rate ({form.rate_value}{form.rate_type === 'percentage' ? '%' : ' PHP'}) resumes after {form.promo_end}</div>
                </div>
              )}
              {form.promo_start && form.promo_end && !isPromoActive && (
                <div style={{ background: 'rgba(89,89,89,0.1)', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 14px', marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: '#595959' }}>Promo scheduled: {form.promo_start} → {form.promo_end}</div>
                </div>
              )}
            </div>

            {/* Connection stats */}
            {connection && (
              <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 20, marginTop: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 14 }}>Connection Stats</div>
                {[
                  { label: 'Active Agents', value: connection.agent_count ?? 0 },
                  { label: 'Units Reserved', value: connection.units_reserved ?? 0 },
                  { label: 'Units Sold', value: connection.units_sold ?? 0 },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, color: '#595959' }}>{s.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{s.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
