'use client'
import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://ofw-realty-api-production.up.railway.app'
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://ofw-realty-web.vercel.app'

const DEMO_LISTINGS = [
  { id: 'b1000004', title: 'House & Lot in Bacoor Cavite', type: 'House & Lot', price_php: 2800000, city: 'Bacoor', province: 'Cavite', status: 'active', scam_flag: false, realtor_name: 'Maria Santos', created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'b1000005', title: 'Lot in Dasmariñas Cavite', type: 'Residential Lot', price_php: 1500000, city: 'Dasmariñas', province: 'Cavite', status: 'active', scam_flag: false, realtor_name: 'Juan Dela Cruz', created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: 'b1000009', title: 'Condo Unit in Cebu IT Park', type: 'Condo', price_php: 5200000, city: 'Cebu City', province: 'Cebu', status: 'reserved', scam_flag: false, realtor_name: 'Ana Reyes', created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'b1000011', title: 'Suspicious Lot Listing', type: 'Residential Lot', price_php: 500000, city: 'Davao City', province: 'Davao del Sur', status: 'active', scam_flag: true, realtor_name: 'Unknown Agent', created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
]

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  active:      { bg: 'rgba(16,185,129,0.15)',  color: '#10B981' },
  reserved:    { bg: 'rgba(245,158,11,0.15)',  color: '#F59E0B' },
  sold:        { bg: 'rgba(112,59,247,0.15)',  color: '#703BF7' },
  deactivated: { bg: 'rgba(89,89,89,0.15)',    color: '#595959' },
}

function formatPHP(n: number) {
  return `₱${n.toLocaleString()}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { dateStyle: 'medium' })
}

export default function AdminListingsPage() {
  const [listings, setListings] = useState<any[]>([])
  const [isDemo, setIsDemo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API}/admin/listings?limit=50`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.length) {
          setListings(data)
        } else {
          setListings(DEMO_LISTINGS)
          setIsDemo(true)
        }
      })
      .catch(() => { setListings(DEMO_LISTINGS); setIsDemo(true) })
      .finally(() => setLoading(false))
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  async function handleAction(id: string, action: 'deactivate' | 'flag_scam' | 'unflag') {
    setActing(id)
    try {
      const endpoint = action === 'deactivate'
        ? `${API}/admin/listings/${id}/deactivate`
        : action === 'flag_scam'
          ? `${API}/admin/listings/${id}/flag-scam`
          : `${API}/admin/listings/${id}/unflag`

      const res = await fetch(endpoint, { method: 'PATCH' })

      if (res.ok) {
        setListings(prev => prev.map(l => {
          if (l.id !== id) return l
          if (action === 'deactivate') return { ...l, status: 'deactivated' }
          if (action === 'flag_scam') return { ...l, scam_flag: true }
          return { ...l, scam_flag: false }
        }))
        showToast(action === 'deactivate' ? '✅ Listing deactivated.' : action === 'flag_scam' ? '🚩 Listing flagged as scam.' : '✅ Scam flag removed.')
      } else {
        // Demo mode — apply locally
        setListings(prev => prev.map(l => {
          if (l.id !== id) return l
          if (action === 'deactivate') return { ...l, status: 'deactivated' }
          if (action === 'flag_scam') return { ...l, scam_flag: true }
          return { ...l, scam_flag: false }
        }))
        showToast('⚠️ API unavailable — change applied locally only.')
      }
    } catch {
      showToast('❌ Action failed. Please try again.')
    } finally {
      setActing(null)
    }
  }

  return (
    <div style={{ padding: 32, color: '#fff', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, background: '#0D0D0D', border: `1px solid ${toast.startsWith('✅') ? 'rgba(16,185,129,0.4)' : toast.startsWith('🚩') ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.4)'}`, borderRadius: 10, padding: '14px 20px', fontSize: 14, color: toast.startsWith('✅') ? '#10B981' : toast.startsWith('🚩') ? '#EF4444' : '#F59E0B', zIndex: 9999 }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Listings</h1>
        <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>{listings.length} listings</p>
      </div>

      {isDemo && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>⚠️</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#F59E0B' }}>Demo Mode</span>
          <span style={{ fontSize: 13, color: '#595959' }}>— API unavailable, showing sample data.</span>
        </div>
      )}

      {loading ? (
        <div style={{ color: '#595959', fontSize: 14 }}>Loading…</div>
      ) : (
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 120px 130px 100px 100px 180px', padding: '12px 20px', borderBottom: '1px solid #141414' }}>
            {['Property', 'Type', 'Price', 'Status', 'Listed', 'Actions'].map(h => (
              <div key={h} style={{ fontSize: 11, color: '#595959', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>

          {listings.map((l: any, i: number) => {
            const s = STATUS_STYLE[l.status] ?? STATUS_STYLE.active
            const isActing = acting === l.id
            return (
              <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '2fr 120px 130px 100px 100px 180px', padding: '14px 20px', borderBottom: i < listings.length - 1 ? '1px solid #141414' : 'none', alignItems: 'center', background: l.scam_flag ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{l.title}</span>
                    {l.scam_flag && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: 'rgba(239,68,68,0.2)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                        🚩 SCAM FLAG
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#595959', marginTop: 2 }}>📍 {l.city}, {l.province} · {l.realtor_name}</div>
                </div>
                <div style={{ fontSize: 13, color: '#999' }}>{l.type}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{formatPHP(l.price_php)}</div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: s.bg, color: s.color, textTransform: 'capitalize' }}>
                    {l.status}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#595959' }}>{formatDate(l.created_at)}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <a
                    href={`${WEB_URL}/listings/${l.id}`}
                    target="_blank"
                    style={{ fontSize: 11, color: '#703BF7', padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(112,59,247,0.3)', background: 'rgba(112,59,247,0.08)', textDecoration: 'none' }}
                  >
                    View ↗
                  </a>
                  {l.status !== 'deactivated' && (
                    <button
                      onClick={() => handleAction(l.id, 'deactivate')}
                      disabled={isActing}
                      style={{ fontSize: 11, color: '#F59E0B', padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)', cursor: 'pointer' }}
                    >
                      Deactivate
                    </button>
                  )}
                  {!l.scam_flag ? (
                    <button
                      onClick={() => handleAction(l.id, 'flag_scam')}
                      disabled={isActing}
                      style={{ fontSize: 11, color: '#EF4444', padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', cursor: 'pointer' }}
                    >
                      🚩 Flag
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction(l.id, 'unflag')}
                      disabled={isActing}
                      style={{ fontSize: 11, color: '#595959', padding: '4px 8px', borderRadius: 6, border: '1px solid #1A1A1A', background: '#141414', cursor: 'pointer' }}
                    >
                      Unflag
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
