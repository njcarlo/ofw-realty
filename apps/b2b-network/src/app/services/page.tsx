'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Sidebar } from '@/components/Sidebar'
import type { B2BProfile, B2BServiceOffer } from '@/lib/types'

const SERVICE_TYPES = [
  { key: 'co_broking',    label: 'Co-Broking',        icon: '🤝', color: '#F59E0B' },
  { key: 'referral',      label: 'Referral',           icon: '🔗', color: '#703BF7' },
  { key: 'training',      label: 'Training',           icon: '📚', color: '#06B6D4' },
  { key: 'mentorship',    label: 'Mentorship',         icon: '🎓', color: '#10B981' },
  { key: 'legal',         label: 'Legal',              icon: '⚖️', color: '#8B5CF6' },
  { key: 'appraisal',     label: 'Appraisal',          icon: '📊', color: '#EF4444' },
  { key: 'documentation', label: 'Documentation',      icon: '📋', color: '#F97316' },
  { key: 'marketing',     label: 'Marketing',          icon: '📣', color: '#EC4899' },
  { key: 'other',         label: 'Other',              icon: '✨', color: '#595959' },
]

const SERVICES_PORTAL_URL = process.env.NEXT_PUBLIC_SERVICES_PORTAL_URL ?? 'http://localhost:3006'

export default function ServicesNetworkPage() {
  const router = useRouter()
  const [myProfile, setMyProfile] = useState<B2BProfile | null>(null)
  const [offers, setOffers] = useState<B2BServiceOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', service_type: 'co_broking',
    coverage_areas: '', fee_type: 'negotiable', fee_amount: '',
  })

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session
      if (!session) { router.replace('/login'); return }
      const { data: prof } = await supabase.from('b2b_profiles').select('*').eq('user_id', session.user.id).maybeSingle()
      setMyProfile(prof)

      const { data: serviceOffers } = await supabase.from('b2b_service_offers')
        .select('*, profile:b2b_profiles!profile_id(id, display_name, avatar_url, prc_verified, headline, location)')
        .eq('is_active', true).order('created_at', { ascending: false }).limit(40)
      setOffers(serviceOffers ?? [])
      setLoading(false)
    })
  }, [router])

  async function handleSubmit() {
    if (!myProfile || !form.title || !form.description) return
    setSubmitting(true)
    const { data } = await supabase.from('b2b_service_offers').insert({
      profile_id: myProfile.id,
      title: form.title,
      description: form.description,
      service_type: form.service_type,
      coverage_areas: form.coverage_areas ? form.coverage_areas.split(',').map(s => s.trim()).filter(Boolean) : [],
      fee_type: form.fee_type,
      fee_amount: form.fee_amount ? parseFloat(form.fee_amount) : null,
      is_active: true,
    }).select('*, profile:b2b_profiles!profile_id(id, display_name, avatar_url, prc_verified, headline, location)').single()

    if (data) {
      setOffers(prev => [data, ...prev])
      setShowForm(false)
      setForm({ title: '', description: '', service_type: 'co_broking', coverage_areas: '', fee_type: 'negotiable', fee_amount: '' })
    }
    setSubmitting(false)
  }

  const filtered = filterType ? offers.filter(o => o.service_type === filterType) : offers
  const inputStyle: React.CSSProperties = { width: '100%', background: '#141414', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#fff', outline: 'none', boxSizing: 'border-box' }
  const labelStyle: React.CSSProperties = { fontSize: 12, color: '#595959', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: 'Inter, sans-serif', color: '#fff' }}>
      <Sidebar profile={myProfile ?? undefined} />
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Services Network</h1>
              <p style={{ fontSize: 14, color: '#595959', marginTop: 4 }}>Broker-to-broker services — co-broking, referrals, training, and more</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <a href={SERVICES_PORTAL_URL} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 13, color: '#06B6D4', border: '1px solid rgba(6,182,212,0.3)', borderRadius: 8, padding: '8px 14px' }}>
                Services Portal ↗
              </a>
              {myProfile && (
                <button onClick={() => setShowForm(v => !v)}
                  style={{ background: '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 16px rgba(112,59,247,0.3)' }}>
                  + Offer a Service
                </button>
              )}
            </div>
          </div>

          {/* Offer form */}
          {showForm && (
            <div style={{ background: '#0D0D0D', border: '1px solid rgba(112,59,247,0.2)', borderRadius: 14, padding: 24, marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 18 }}>New Service Offer</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={labelStyle}>Title *</label>
                  <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Co-Broking Partner for Cavite Listings" style={inputStyle} onFocus={e => (e.target.style.borderColor = 'rgba(112,59,247,0.4)')} onBlur={e => (e.target.style.borderColor = '#1A1A1A')} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={labelStyle}>Description *</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Describe what you're offering and who it's for…" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} onFocus={e => (e.target.style.borderColor = 'rgba(112,59,247,0.4)')} onBlur={e => (e.target.style.borderColor = '#1A1A1A')} />
                </div>
                <div>
                  <label style={labelStyle}>Service Type *</label>
                  <select value={form.service_type} onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {SERVICE_TYPES.map(t => <option key={t.key} value={t.key}>{t.icon} {t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Coverage Areas</label>
                  <input type="text" value={form.coverage_areas} onChange={e => setForm(f => ({ ...f, coverage_areas: e.target.value }))} placeholder="e.g. Cavite, Laguna, Metro Manila" style={inputStyle} onFocus={e => (e.target.style.borderColor = 'rgba(112,59,247,0.4)')} onBlur={e => (e.target.style.borderColor = '#1A1A1A')} />
                </div>
                <div>
                  <label style={labelStyle}>Fee Type</label>
                  <select value={form.fee_type} onChange={e => setForm(f => ({ ...f, fee_type: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="free">Free</option>
                    <option value="negotiable">Negotiable</option>
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </div>
                {(form.fee_type === 'fixed' || form.fee_type === 'percentage') && (
                  <div>
                    <label style={labelStyle}>{form.fee_type === 'percentage' ? 'Percentage (%)' : 'Amount (PHP)'}</label>
                    <input type="number" value={form.fee_amount} onChange={e => setForm(f => ({ ...f, fee_amount: e.target.value }))} placeholder={form.fee_type === 'percentage' ? 'e.g. 3' : 'e.g. 5000'} style={inputStyle} onFocus={e => (e.target.style.borderColor = 'rgba(112,59,247,0.4)')} onBlur={e => (e.target.style.borderColor = '#1A1A1A')} />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button onClick={() => setShowForm(false)} style={{ flex: 1, background: 'transparent', color: '#595959', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 0', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSubmit} disabled={submitting || !form.title || !form.description}
                  style={{ flex: 2, background: submitting || !form.title ? '#333' : '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontSize: 14, fontWeight: 600, cursor: submitting || !form.title ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'Posting…' : 'Post Service Offer'}
                </button>
              </div>
            </div>
          )}

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            <button onClick={() => setFilterType('')}
              style={{ padding: '6px 14px', borderRadius: 99, border: `1px solid ${!filterType ? 'rgba(112,59,247,0.4)' : '#1A1A1A'}`, background: !filterType ? 'rgba(112,59,247,0.1)' : 'transparent', color: !filterType ? '#703BF7' : '#595959', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              All
            </button>
            {SERVICE_TYPES.map(t => (
              <button key={t.key} onClick={() => setFilterType(filterType === t.key ? '' : t.key)}
                style={{ padding: '6px 14px', borderRadius: 99, border: `1px solid ${filterType === t.key ? `${t.color}60` : '#1A1A1A'}`, background: filterType === t.key ? `${t.color}15` : 'transparent', color: filterType === t.key ? t.color : '#595959', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Offers grid */}
          {loading ? <div style={{ color: '#595959', fontSize: 14 }}>Loading…</div> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {filtered.length === 0 && <div style={{ color: '#595959', fontSize: 14, gridColumn: '1/-1', padding: '40px 0', textAlign: 'center' }}>No service offers yet. Be the first to post one!</div>}
              {filtered.map(offer => {
                const typeCfg = SERVICE_TYPES.find(t => t.key === offer.service_type) ?? SERVICE_TYPES[SERVICE_TYPES.length - 1]
                return (
                  <div key={offer.id} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 11, background: `${typeCfg.color}20`, color: typeCfg.color, padding: '3px 10px', borderRadius: 99, fontWeight: 600 }}>{typeCfg.icon} {typeCfg.label}</span>
                      {offer.fee_type && (
                        <span style={{ fontSize: 11, color: '#595959' }}>
                          {offer.fee_type === 'free' ? '🆓 Free' : offer.fee_type === 'negotiable' ? '💬 Negotiable' : offer.fee_type === 'percentage' ? `${offer.fee_amount}%` : `₱${Number(offer.fee_amount).toLocaleString()}`}
                        </span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{offer.title}</div>
                      <div style={{ fontSize: 13, color: '#595959', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{offer.description}</div>
                    </div>
                    {offer.coverage_areas && offer.coverage_areas.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {offer.coverage_areas.map(a => <span key={a} style={{ fontSize: 10, background: '#141414', color: '#595959', padding: '2px 7px', borderRadius: 99, border: '1px solid #1A1A1A' }}>📍 {a}</span>)}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: '1px solid #141414', marginTop: 'auto' }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(112,59,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, overflow: 'hidden', flexShrink: 0 }}>
                        {offer.profile?.avatar_url ? <img src={offer.profile.avatar_url} style={{ width: 30, height: 30, objectFit: 'cover' }} alt="" /> : '👤'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{offer.profile?.display_name}</div>
                        {offer.profile?.prc_verified && <span style={{ fontSize: 10, color: '#10B981' }}>✓ PRC Verified</span>}
                      </div>
                      <a href={`/messages?to=${offer.profile_id}`} style={{ fontSize: 11, color: '#703BF7', border: '1px solid rgba(112,59,247,0.3)', borderRadius: 6, padding: '4px 8px', flexShrink: 0 }}>Contact</a>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
