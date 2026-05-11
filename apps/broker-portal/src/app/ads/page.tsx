'use client'
import { useState, useEffect } from 'react'
import { BrokerSidebar } from '@/components/BrokerSidebar'
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
  { code: 'CA', label: '🇨🇦 Canada' },
  { code: 'AU', label: '🇦🇺 Australia' },
  { code: 'JP', label: '🇯🇵 Japan' },
  { code: 'KR', label: '🇰🇷 South Korea' },
]

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  pending_review: { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B', label: '⏳ Pending Review' },
  active:         { bg: 'rgba(16,185,129,0.15)', color: '#10B981', label: '● Active' },
  paused:         { bg: 'rgba(89,89,89,0.15)',   color: '#595959', label: '⏸ Paused' },
  completed:      { bg: 'rgba(59,130,246,0.15)', color: '#3B82F6', label: '✓ Completed' },
  rejected:       { bg: 'rgba(239,68,68,0.15)',  color: '#EF4444', label: '✗ Rejected' },
}

export default function AdsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [spend, setSpend] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState('')
  const [fbConnected, setFbConnected] = useState(false)
  const [fbAdAccountMissing, setFbAdAccountMissing] = useState(false)

  // New campaign form state
  const [listingId, setListingId] = useState('')
  const [budget, setBudget] = useState(1500)
  const [duration, setDuration] = useState(7)
  const [countries, setCountries] = useState<string[]>(['AE', 'SA', 'SG'])
  const [imageUrl, setImageUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

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
        body: JSON.stringify({
          listing_id: listingId,
          budget_php: budget,
          duration_days: duration,
          target_countries: countries,
          image_url: imageUrl,
          caption: caption || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        setToast(`❌ ${err.message}`)
      } else {
        setToast('✅ Campaign created! Pending Meta review.')
        setShowModal(false)
        loadData()
      }
    } catch {
      setToast('❌ Failed to create campaign. Check API connection.')
    }
    setSubmitting(false)
    setTimeout(() => setToast(''), 5000)
  }

  async function updateStatus(id: string, action: 'pause' | 'resume' | 'stop') {
    try {
      const res = await fetch(`${API}/ads/${id}/${action}`, { method: 'PATCH', credentials: 'include' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setToast(`❌ Failed to ${action} campaign: ${err.message ?? res.statusText}`)
        return
      }
      setToast(`✅ Campaign ${action}d.`)
      loadData()
    } catch {
      setToast(`❌ Network error — could not ${action} campaign. Check your connection.`)
    }
    setTimeout(() => setToast(''), 4000)
  }

  function toggleCountry(code: string) {
    setCountries(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])
  }

  const MONTHLY_CAP = spend?.monthly_cap ?? 100000
  const totalSpent = spend?.total_spent ?? 0
  const remaining = spend?.remaining_cap ?? MONTHLY_CAP
  const capPct = Math.min((spend?.total_budget ?? 0) / MONTHLY_CAP * 100, 100)

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <BrokerSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>

        {toast && (
          <div style={{ position: 'fixed', top: 24, right: 24, background: '#0D0D0D', border: `1px solid ${toast.startsWith('✅') ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`, borderRadius: 10, padding: '14px 20px', fontSize: 14, color: toast.startsWith('✅') ? '#10B981' : '#EF4444', zIndex: 9999 }}>
            {toast}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Facebook Ad Campaigns</h1>
            <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>Paid ads targeting OFWs abroad via Meta Marketing API</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            disabled={!fbConnected || fbAdAccountMissing}
            title={!fbConnected ? 'Connect your Facebook account first' : fbAdAccountMissing ? 'Select an Ad Account first' : ''}
            style={{ background: fbConnected && !fbAdAccountMissing ? '#703BF7' : '#1A1A1A', color: fbConnected && !fbAdAccountMissing ? '#fff' : '#595959', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: fbConnected && !fbAdAccountMissing ? 'pointer' : 'not-allowed', boxShadow: fbConnected && !fbAdAccountMissing ? '0 0 20px rgba(112,59,247,0.3)' : 'none' }}
          >
            📢 New Campaign
          </button>
        </div>

        <FacebookConnectBanner
          onConnected={(conn) => {
            setFbConnected(true)
            setFbAdAccountMissing(!conn.fb_ad_account_id)
          }}
          onDisconnected={() => { setFbConnected(false); setFbAdAccountMissing(false) }}
        />

        {/* Warning when connected but no ad account selected */}
        {fbConnected && fbAdAccountMissing && (
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '10px 16px', marginBottom: 20, fontSize: 13, color: '#F59E0B' }}>
            ⚠️ No Ad Account selected. Click "Change Account" above to pick your Meta Ad Account before creating campaigns.
          </div>
        )}

        {/* Budget cap */}
        <div style={{ background: '#0D0D0D', border: `1px solid ${spend?.warning ? 'rgba(239,68,68,0.3)' : '#1A1A1A'}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Monthly Ad Spend Cap</div>
            <div style={{ fontSize: 13, color: spend?.warning ? '#EF4444' : '#595959' }}>
              ₱{(spend?.total_budget ?? 0).toLocaleString()} / ₱{MONTHLY_CAP.toLocaleString()}
              {spend?.warning && ' ⚠️ Cap almost reached'}
            </div>
          </div>
          <div style={{ background: '#1A1A1A', borderRadius: 99, height: 8 }}>
            <div style={{ width: `${capPct}%`, height: '100%', background: capPct > 90 ? '#EF4444' : '#703BF7', borderRadius: 99, transition: 'width 0.5s' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 16 }}>
            {[
              { label: 'Total Budget', value: `₱${(spend?.total_budget ?? 0).toLocaleString()}`, color: '#703BF7' },
              { label: 'Total Spent', value: `₱${totalSpent.toLocaleString()}`, color: '#F59E0B' },
              { label: 'Remaining Cap', value: `₱${remaining.toLocaleString()}`, color: remaining < 500 ? '#EF4444' : '#10B981' },
            ].map(s => (
              <div key={s.label} style={{ background: '#141414', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#595959', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Campaigns list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#595959' }}>Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#595959' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📢</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#999', marginBottom: 8 }}>No campaigns yet</div>
            <div style={{ fontSize: 13 }}>Create your first Facebook ad campaign to reach OFWs abroad</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {campaigns.map((ad: any) => {
              const s = STATUS_COLORS[ad.status] ?? STATUS_COLORS.pending_review
              return (
                <div key={ad.id} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                        {ad.listings?.title ?? 'Listing'}
                      </div>
                      <div style={{ fontSize: 13, color: '#595959' }}>
                        🌍 {(ad.target_countries ?? []).join(', ')} · {ad.duration_days}d campaign
                      </div>
                      {ad.meta_campaign_id && (
                        <div style={{ fontSize: 11, color: '#595959', marginTop: 4, fontFamily: 'monospace' }}>
                          Meta ID: {ad.meta_campaign_id}
                        </div>
                      )}
                      {ad.rejection_reason && (
                        <div style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>
                          Rejection: {ad.rejection_reason}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                      <span style={{ fontSize: 12, color: '#595959' }}>Ends {ad.end_date}</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
                    {[
                      { label: 'Budget', value: `₱${(ad.budget_php ?? 0).toLocaleString()}` },
                      { label: 'Spent', value: `₱${(ad.cost_spent_php ?? 0).toLocaleString()}` },
                      { label: 'Impressions', value: (ad.impressions ?? 0).toLocaleString() },
                      { label: 'Reach', value: (ad.reach ?? 0).toLocaleString() },
                      { label: 'Clicks', value: (ad.clicks ?? 0).toLocaleString() },
                    ].map(s => (
                      <div key={s.label} style={{ background: '#141414', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 12px' }}>
                        <div style={{ fontSize: 10, color: '#595959', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    {ad.status === 'active' && (
                      <button onClick={() => updateStatus(ad.id, 'pause')} style={{ background: 'transparent', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '7px 14px', fontSize: 12, cursor: 'pointer' }}>⏸ Pause</button>
                    )}
                    {ad.status === 'paused' && (
                      <button onClick={() => updateStatus(ad.id, 'resume')} style={{ background: 'transparent', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '7px 14px', fontSize: 12, cursor: 'pointer' }}>▶ Resume</button>
                    )}
                    {(ad.status === 'active' || ad.status === 'paused') && (
                      <button onClick={() => updateStatus(ad.id, 'stop')} style={{ background: 'transparent', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '7px 14px', fontSize: 12, cursor: 'pointer' }}>⏹ Stop</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* New Campaign Modal */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 16, padding: 32, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto' }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>📢 New Facebook Ad Campaign</h2>
              <p style={{ fontSize: 13, color: '#595959', margin: '0 0 24px' }}>Campaign will be submitted to Meta for review before going live.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#595959', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Listing ID</label>
                  <input value={listingId} onChange={e => setListingId(e.target.value)} placeholder="Paste listing UUID from your listings page" style={{ width: '100%', background: '#141414', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#fff', boxSizing: 'border-box' }} />
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
                  <label style={{ fontSize: 12, color: '#595959', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Target Countries (OFW Markets)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {OFW_COUNTRIES.map(c => (
                      <button key={c.code} type="button" onClick={() => toggleCountry(c.code)} style={{ background: countries.includes(c.code) ? 'rgba(112,59,247,0.2)' : '#141414', border: `1px solid ${countries.includes(c.code) ? 'rgba(112,59,247,0.5)' : '#1A1A1A'}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, color: countries.includes(c.code) ? '#703BF7' : '#999', cursor: 'pointer' }}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, color: '#595959', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Caption (optional — auto-generated if blank)</label>
                  <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={4} placeholder="Leave blank to auto-generate from listing details..." style={{ width: '100%', background: '#141414', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#fff', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>

                <div style={{ background: '#141414', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#595959' }}>
                  Daily budget: ₱{Math.round(budget / duration).toLocaleString()} · Total: ₱{budget.toLocaleString()} · Remaining cap: ₱{remaining.toLocaleString()}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', color: '#595959', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
                <button onClick={createCampaign} disabled={submitting || !listingId || !imageUrl || countries.length === 0} style={{ background: submitting ? '#333' : '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'Creating...' : '🚀 Launch Campaign'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
