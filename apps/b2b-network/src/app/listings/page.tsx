'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Sidebar } from '@/components/Sidebar'
import type { B2BProfile } from '@/lib/types'

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000'
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const PROP_LABELS: Record<string, string> = {
  house_and_lot: 'House & Lot', residential_lot: 'Residential Lot',
  condo: 'Condo', commercial: 'Commercial', farm_lot: 'Farm Lot',
}

function formatPHP(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  return `₱${(n / 1000).toFixed(0)}K`
}

export default function ListingsNetworkPage() {
  const router = useRouter()
  const [myProfile, setMyProfile] = useState<B2BProfile | null>(null)
  const [shares, setShares] = useState<any[]>([])
  const [myListings, setMyListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'network' | 'mine'>('network')
  const [sharing, setSharing] = useState<string | null>(null)
  const [shareForm, setShareForm] = useState({ co_broke: false, commission_split: '', note: '' })

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session
      if (!session) { router.replace('/login'); return }
      const { data: prof } = await supabase.from('b2b_profiles').select('*').eq('user_id', session.user.id).maybeSingle()
      setMyProfile(prof)

      // Network listing shares
      const { data: networkShares } = await supabase.from('b2b_listing_shares')
        .select(`*, profile:b2b_profiles!profile_id(id, display_name, avatar_url, prc_verified, headline), listing:listings(id, title, price_php, city, province, property_type, lot_area_sqm, listing_photos(url, is_primary))`)
        .order('created_at', { ascending: false }).limit(30)
      setShares(networkShares ?? [])

      // My listings from API
      try {
        const res = await fetch(`${API_URL}/listings`, { headers: { Authorization: `Bearer ${session.access_token}` } })
        if (res.ok) setMyListings(await res.json())
      } catch {}

      setLoading(false)
    })
  }, [router])

  async function handleShare(listingId: string) {
    if (!myProfile) return
    await supabase.from('b2b_listing_shares').upsert({
      profile_id: myProfile.id,
      listing_id: listingId,
      co_broke: shareForm.co_broke,
      commission_split: shareForm.commission_split ? parseFloat(shareForm.commission_split) : null,
      note: shareForm.note || null,
    }, { onConflict: 'profile_id,listing_id' })
    setSharing(null)
    setShareForm({ co_broke: false, commission_split: '', note: '' })
    // Refresh
    const { data } = await supabase.from('b2b_listing_shares')
      .select(`*, profile:b2b_profiles!profile_id(id, display_name, avatar_url, prc_verified, headline), listing:listings(id, title, price_php, city, province, property_type, lot_area_sqm, listing_photos(url, is_primary))`)
      .order('created_at', { ascending: false }).limit(30)
    setShares(data ?? [])
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: 'Inter, sans-serif', color: '#fff' }}>
      <Sidebar profile={myProfile ?? undefined} />
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Listings Network</h1>
              <p style={{ fontSize: 14, color: '#595959', marginTop: 4 }}>Browse shared listings and co-broking opportunities from the network</p>
            </div>
            <a href={`${WEB_URL}/listings`} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 13, color: '#703BF7', border: '1px solid rgba(112,59,247,0.3)', borderRadius: 8, padding: '8px 14px' }}>
              Browse All Listings ↗
            </a>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 10, padding: 4, marginBottom: 24, width: 'fit-content' }}>
            {[{ key: 'network', label: '🌐 Network Shares' }, { key: 'mine', label: '🏘️ My Listings' }].map(t => (
              <button key={t.key} onClick={() => setTab(t.key as any)}
                style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: tab === t.key ? '#1A1A1A' : 'transparent', color: tab === t.key ? '#fff' : '#595959', fontSize: 13, fontWeight: tab === t.key ? 600 : 400, cursor: 'pointer' }}>
                {t.label}
              </button>
            ))}
          </div>

          {loading ? <div style={{ color: '#595959', fontSize: 14 }}>Loading…</div> : (
            <>
              {/* Network shares */}
              {tab === 'network' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {shares.length === 0 && <div style={{ color: '#595959', fontSize: 14, gridColumn: '1/-1', padding: '40px 0', textAlign: 'center' }}>No listings shared yet. Be the first!</div>}
                  {shares.map(s => {
                    const l = s.listing
                    const photo = l?.listing_photos?.find((p: any) => p.is_primary) ?? l?.listing_photos?.[0]
                    return (
                      <div key={s.id} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, overflow: 'hidden' }}>
                        <div style={{ height: 140, background: '#141414', position: 'relative' }}>
                          {photo && <img src={photo.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                          {s.co_broke && (
                            <div style={{ position: 'absolute', top: 8, left: 8, background: '#F59E0B', color: '#000', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}>
                              🤝 Co-Broke {s.commission_split ? `${s.commission_split}%` : ''}
                            </div>
                          )}
                        </div>
                        <div style={{ padding: '12px 14px' }}>
                          <div style={{ fontSize: 11, color: '#595959', marginBottom: 4 }}>{PROP_LABELS[l?.property_type] ?? l?.property_type}</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l?.title}</div>
                          <div style={{ fontSize: 12, color: '#595959', marginBottom: 8 }}>📍 {l?.city}, {l?.province}</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#703BF7', marginBottom: 10 }}>{l ? formatPHP(l.price_php) : '—'}</div>
                          {s.note && <div style={{ fontSize: 12, color: '#595959', fontStyle: 'italic', marginBottom: 10 }}>"{s.note}"</div>}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: '1px solid #141414' }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(112,59,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, overflow: 'hidden' }}>
                              {s.profile?.avatar_url ? <img src={s.profile.avatar_url} style={{ width: 28, height: 28, objectFit: 'cover' }} alt="" /> : '👤'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.profile?.display_name}</div>
                              {s.profile?.prc_verified && <span style={{ fontSize: 10, color: '#10B981' }}>✓ PRC Verified</span>}
                            </div>
                            <a href={`${WEB_URL}/listings/${l?.id}`} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: 11, color: '#703BF7', border: '1px solid rgba(112,59,247,0.3)', borderRadius: 6, padding: '4px 8px' }}>View ↗</a>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* My listings */}
              {tab === 'mine' && (
                <div>
                  {myListings.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#595959' }}>
                      <div style={{ fontSize: 14, marginBottom: 12 }}>No listings found. Add listings from the Agent Portal.</div>
                      <a href={process.env.NEXT_PUBLIC_AGENT_PORTAL_URL ?? 'http://localhost:3002'} target="_blank" rel="noopener noreferrer"
                        style={{ background: '#703BF7', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                        Go to Agent Portal →
                      </a>
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {myListings.map((l: any) => {
                      const photo = l.listing_photos?.find((p: any) => p.is_primary) ?? l.listing_photos?.[0]
                      const alreadyShared = shares.some(s => s.listing_id === l.id && s.profile_id === myProfile?.id)
                      return (
                        <div key={l.id} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, overflow: 'hidden' }}>
                          <div style={{ height: 120, background: '#141414' }}>
                            {photo && <img src={photo.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                          </div>
                          <div style={{ padding: '12px 14px' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                            <div style={{ fontSize: 12, color: '#595959', marginBottom: 8 }}>📍 {l.city}, {l.province}</div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#703BF7', marginBottom: 12 }}>{formatPHP(l.price_php)}</div>

                            {sharing === l.id ? (
                              <div style={{ background: '#141414', borderRadius: 8, padding: 12 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, cursor: 'pointer' }}>
                                  <input type="checkbox" checked={shareForm.co_broke} onChange={e => setShareForm(f => ({ ...f, co_broke: e.target.checked }))} />
                                  <span style={{ fontSize: 13, color: '#fff' }}>Open to Co-Broking</span>
                                </label>
                                {shareForm.co_broke && (
                                  <input type="number" placeholder="Commission split %" value={shareForm.commission_split} onChange={e => setShareForm(f => ({ ...f, commission_split: e.target.value }))}
                                    style={{ width: '100%', background: '#0D0D0D', border: '1px solid #262626', borderRadius: 6, padding: '6px 10px', fontSize: 13, color: '#fff', outline: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
                                )}
                                <input type="text" placeholder="Note (optional)" value={shareForm.note} onChange={e => setShareForm(f => ({ ...f, note: e.target.value }))}
                                  style={{ width: '100%', background: '#0D0D0D', border: '1px solid #262626', borderRadius: 6, padding: '6px 10px', fontSize: 13, color: '#fff', outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button onClick={() => handleShare(l.id)} style={{ flex: 1, background: '#703BF7', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Share</button>
                                  <button onClick={() => setSharing(null)} style={{ flex: 1, background: 'transparent', color: '#595959', border: '1px solid #1A1A1A', borderRadius: 6, padding: '7px 0', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => alreadyShared ? null : setSharing(l.id)} disabled={alreadyShared}
                                style={{ width: '100%', background: alreadyShared ? 'transparent' : 'rgba(112,59,247,0.1)', color: alreadyShared ? '#595959' : '#703BF7', border: `1px solid ${alreadyShared ? '#1A1A1A' : 'rgba(112,59,247,0.3)'}`, borderRadius: 8, padding: '8px 0', fontSize: 13, fontWeight: 600, cursor: alreadyShared ? 'default' : 'pointer' }}>
                                {alreadyShared ? '✓ Shared to Network' : '🌐 Share to Network'}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
