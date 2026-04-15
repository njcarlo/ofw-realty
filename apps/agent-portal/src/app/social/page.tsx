'use client'
import { useState, useEffect } from 'react'
import { AgentSidebar } from '@/components/AgentSidebar'
import { FacebookConnectBanner } from '@/components/FacebookConnectBanner'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const OFW_COUNTRIES = [
  { code: 'AE', label: '🇦🇪 UAE' },
  { code: 'SA', label: '🇸🇦 Saudi Arabia' },
  { code: 'SG', label: '🇸🇬 Singapore' },
  { code: 'HK', label: '🇭🇰 Hong Kong' },
  { code: 'QA', label: '🇶🇦 Qatar' },
  { code: 'KW', label: '🇰🇼 Kuwait' },
  { code: 'GB', label: '🇬🇧 UK' },
  { code: 'US', label: '🇺🇸 USA' },
]

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  pending_review: { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B', label: '⏳ Pending Review' },
  active:         { bg: 'rgba(16,185,129,0.15)', color: '#10B981', label: '● Active' },
  paused:         { bg: 'rgba(89,89,89,0.15)',   color: '#595959', label: '⏸ Paused' },
  completed:      { bg: 'rgba(59,130,246,0.15)', color: '#3B82F6', label: '✓ Completed' },
  rejected:       { bg: 'rgba(239,68,68,0.15)',  color: '#EF4444', label: '✗ Rejected' },
}

// Demo organic posts (would come from n8n social workflow)
const POSTS = [
  { listing: 'House & Lot in Bacoor Cavite', platform: 'Facebook', status: 'published', reach: 1240, clicks: 87, date: 'Apr 12, 2026' },
  { listing: 'Condo Unit in Cebu IT Park', platform: 'Instagram', status: 'published', reach: 890, clicks: 54, date: 'Apr 11, 2026' },
  { listing: 'Lot in Sta. Rosa Laguna', platform: 'Facebook', status: 'scheduled', reach: 0, clicks: 0, date: 'Apr 16, 2026' },
]

export default function SocialPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [spend, setSpend] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAdModal, setShowAdModal] = useState(false)
  const [toast, setToast] = useState('')
  const [fbConnected, setFbConnected] = useState(false)

  const [listingId, setListingId] = useState('')
  const [budget, setBudget] = useState(1500)
  const [duration, setDuration] = useState(7)
  const [countries, setCountries] = useState<string[]>(['AE', 'SA', 'SG'])
  const [imageUrl, setImageUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [cRes, sRes] = await Promise.all([
        fetch(`${API}/ads`, { credentials: 'include' }),
        fetch(`${API}/ads/monthly-spend`, { credentials: 'include' }),
      ])
      if (cRes.ok) setCampaigns(await cRes.json())
      if (sRes.ok) setSpend(await sRes.json())
    } catch {}
    setLoading(false)
  }

  async function createCampaign() {
    setSubmitting(true)
    try {
      const res = await fetch(`${API}/ads`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId, budget_php: budget, duration_days: duration, target_countries: countries, image_url: imageUrl, caption: caption || undefined }),
      })
      if (!res.ok) {
        const err = await res.json()
        setToast(`❌ ${err.message}`)
      } else {
        setToast('✅ Campaign created! Pending Meta review.')
        setShowAdModal(false)
        loadData()
      }
    } catch { setToast('❌ Failed to create campaign.') }
    setSubmitting(false)
    setTimeout(() => setToast(''), 5000)
  }

  async function updateStatus(id: string, action: 'pause' | 'resume' | 'stop') {
    await fetch(`${API}/ads/${id}/${action}`, { method: 'PATCH', credentials: 'include' })
    setToast(`✅ Campaign ${action}d.`)
    setTimeout(() => setToast(''), 3000)
    loadData()
  }

  function toggleCountry(code: string) {
    setCountries(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])
  }

  const remaining = spend?.remaining_cap ?? 100000

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <AgentSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>

        {toast && (
          <div style={{ position: 'fixed', top: 24, right: 24, background: '#0D0D0D', border: `1px solid ${toast.startsWith('✅') ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`, borderRadius: 10, padding: '14px 20px', fontSize: 14, color: toast.startsWith('✅') ? '#10B981' : '#EF4444', zIndex: 9999 }}>
            {toast}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Social Media</h1>
            <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>Organic posts and paid Facebook ads</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ background: '#0D0D0D', color: '#999', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
              📱 New Post
            </button>
            <button
              onClick={() => setShowAdModal(true)}
              disabled={!fbConnected}
              title={!fbConnected ? 'Connect your Facebook account first' : ''}
              style={{ background: fbConnected ? '#703BF7' : '#1A1A1A', color: fbConnected ? '#fff' : '#595959', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: fbConnected ? 'pointer' : 'not-allowed', boxShadow: fbConnected ? '0 0 20px rgba(112,59,247,0.3)' : 'none' }}
            >
              📢 Run Ad
            </button>
          </div>
        </div>

        {/* Organic Posts */}
        <div style={{ marginBottom: 32 }}>
          <FacebookConnectBanner
            onConnected={() => setFbConnected(true)}
            onDisconnected={() => setFbConnected(false)}
          />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Organic Posts</h2>
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
            {POSTS.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: i < POSTS.length - 1 ? '1px solid #141414' : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: p.platform === 'Facebook' ? 'rgba(59,130,246,0.15)' : 'rgba(236,72,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {p.platform === 'Facebook' ? '📘' : '📸'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{p.listing}</div>
                  <div style={{ fontSize: 12, color: '#595959' }}>{p.platform} · {p.date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {p.status === 'published' && <div style={{ fontSize: 13, color: '#999' }}>👁️ {p.reach.toLocaleString()} reach · 🖱️ {p.clicks} clicks</div>}
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: p.status === 'published' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: p.status === 'published' ? '#10B981' : '#F59E0B', textTransform: 'capitalize' }}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Paid Campaigns */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Facebook Ad Campaigns</h2>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#595959' }}>Loading...</div>
          ) : campaigns.length === 0 ? (
            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 32, textAlign: 'center', color: '#595959' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📢</div>
              <div style={{ fontSize: 14 }}>No campaigns yet. Click "Run Ad" to create your first paid campaign.</div>
            </div>
          ) : campaigns.map((ad: any) => {
            const s = STATUS_COLORS[ad.status] ?? STATUS_COLORS.pending_review
            return (
              <div key={ad.id} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 24, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{ad.listings?.title ?? 'Listing'}</div>
                    <div style={{ fontSize: 13, color: '#595959' }}>🌍 {(ad.target_countries ?? []).join(', ')} · {ad.duration_days}d</div>
                    {ad.rejection_reason && <div style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>Rejection: {ad.rejection_reason}</div>}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: s.bg, color: s.color }}>{s.label}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
                  {[
                    { label: 'Budget', value: `₱${(ad.budget_php ?? 0).toLocaleString()}` },
                    { label: 'Spent', value: `₱${(ad.cost_spent_php ?? 0).toLocaleString()}` },
                    { label: 'Impressions', value: (ad.impressions ?? 0).toLocaleString() },
                    { label: 'Clicks', value: (ad.clicks ?? 0).toLocaleString() },
                  ].map(s => (
                    <div key={s.label} style={{ background: '#141414', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, color: '#595959', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {ad.status === 'active' && <button onClick={() => updateStatus(ad.id, 'pause')} style={{ background: 'transparent', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>⏸ Pause</button>}
                  {ad.status === 'paused' && <button onClick={() => updateStatus(ad.id, 'resume')} style={{ background: 'transparent', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>▶ Resume</button>}
                  {(ad.status === 'active' || ad.status === 'paused') && <button onClick={() => updateStatus(ad.id, 'stop')} style={{ background: 'transparent', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>⏹ Stop</button>}
                </div>
              </div>
            )
          })}
        </div>

        {/* New Ad Modal */}
        {showAdModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 16, padding: 32, width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto' }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>📢 Run Facebook Ad</h2>
              <p style={{ fontSize: 13, color: '#595959', margin: '0 0 20px' }}>Submitted to Meta for review. Goes live within 24h.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#595959', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Listing ID</label>
                  <input value={listingId} onChange={e => setListingId(e.target.value)} placeholder="Listing UUID" style={{ width: '100%', background: '#141414', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#fff', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#595959', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Ad Image URL</label>
                  <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', background: '#141414', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#fff', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: '#595959', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Budget (PHP)</label>
                    <input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))} min={500} style={{ width: '100%', background: '#141414', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#fff', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#595959', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Duration</label>
                    <select value={duration} onChange={e => setDuration(Number(e.target.value))} style={{ width: '100%', background: '#141414', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#fff', boxSizing: 'border-box' }}>
                      <option value={7}>7 days</option>
                      <option value={14}>14 days</option>
                      <option value={30}>30 days</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#595959', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Target Countries</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {OFW_COUNTRIES.map(c => (
                      <button key={c.code} type="button" onClick={() => toggleCountry(c.code)} style={{ background: countries.includes(c.code) ? 'rgba(112,59,247,0.2)' : '#141414', border: `1px solid ${countries.includes(c.code) ? 'rgba(112,59,247,0.5)' : '#1A1A1A'}`, borderRadius: 8, padding: '5px 10px', fontSize: 12, color: countries.includes(c.code) ? '#703BF7' : '#999', cursor: 'pointer' }}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ background: '#141414', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#595959' }}>
                  Daily: ₱{Math.round(budget / duration).toLocaleString()} · Total: ₱{budget.toLocaleString()} · Cap remaining: ₱{remaining.toLocaleString()}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowAdModal(false)} style={{ background: 'transparent', color: '#595959', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
                <button onClick={createCampaign} disabled={submitting || !listingId || !imageUrl || countries.length === 0} style={{ background: submitting ? '#333' : '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'Creating...' : '🚀 Launch'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
