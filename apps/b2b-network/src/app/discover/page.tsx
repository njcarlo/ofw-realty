'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Sidebar } from '@/components/Sidebar'
import type { B2BProfile } from '@/lib/types'

const SPECIALIZATIONS = ['Residential', 'Commercial', 'Industrial', 'Farm Lots', 'Condominiums', 'OFW Clients', 'Foreclosures', 'Pre-Selling']
const LOCATIONS = ['Metro Manila', 'Cavite', 'Laguna', 'Batangas', 'Cebu', 'Davao', 'Pampanga', 'Iloilo', 'Bulacan']

export default function DiscoverPage() {
  const router = useRouter()
  const [myProfile, setMyProfile] = useState<B2BProfile | null>(null)
  const [profiles, setProfiles] = useState<B2BProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [filterSpec, setFilterSpec] = useState('')
  const [filterVerified, setFilterVerified] = useState(false)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [connected, setConnected] = useState<Set<string>>(new Set())

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session
      if (!session) { router.replace('/login'); return }

      const { data: prof } = await supabase.from('b2b_profiles').select('*').eq('user_id', session.user.id).maybeSingle()
      setMyProfile(prof)

      let q = supabase.from('b2b_profiles').select('*').eq('is_active', true).order('prc_verified', { ascending: false }).order('connection_count', { ascending: false }).limit(40)
      if (session.user.id) q = q.neq('user_id', session.user.id)

      const { data: profs } = await q
      setProfiles(profs ?? [])

      // Load existing connections
      if (prof) {
        const { data: conns } = await supabase.from('b2b_connections').select('addressee_id, requester_id, status').or(`requester_id.eq.${prof.id},addressee_id.eq.${prof.id}`).eq('status', 'accepted')
        const connSet = new Set<string>()
        conns?.forEach(c => {
          if (c.requester_id === prof.id) connSet.add(c.addressee_id)
          else connSet.add(c.requester_id)
        })
        setConnected(connSet)
      }
      setLoading(false)
    })
  }, [router])

  async function handleConnect(targetId: string) {
    if (!myProfile) return
    setConnecting(targetId)
    await supabase.from('b2b_connections').insert({ requester_id: myProfile.id, addressee_id: targetId, status: 'pending' })
    setConnecting(null)
    setConnected(prev => new Set([...prev, targetId]))
  }

  const filtered = profiles.filter(p => {
    if (filterVerified && !p.prc_verified) return false
    if (filterLocation && !p.location?.toLowerCase().includes(filterLocation.toLowerCase())) return false
    if (filterSpec && !p.specializations?.some(s => s.toLowerCase().includes(filterSpec.toLowerCase()))) return false
    if (search) {
      const q = search.toLowerCase()
      return p.display_name.toLowerCase().includes(q) || p.headline?.toLowerCase().includes(q) || p.location?.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: 'Inter, sans-serif', color: '#fff' }}>
      <Sidebar profile={myProfile ?? undefined} />
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Discover Brokers</h1>
          <p style={{ fontSize: 14, color: '#595959', marginTop: 4 }}>Find and connect with verified real estate professionals across the Philippines</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, headline, location…"
            style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 8, padding: '9px 14px', fontSize: 14, color: '#fff', outline: 'none', width: 280 }}
            onFocus={e => (e.target.style.borderColor = 'rgba(112,59,247,0.4)')}
            onBlur={e => (e.target.style.borderColor = '#1A1A1A')}
          />
          <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)}
            style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 8, padding: '9px 14px', fontSize: 14, color: filterLocation ? '#fff' : '#595959', outline: 'none', cursor: 'pointer' }}>
            <option value="">All Locations</option>
            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={filterSpec} onChange={e => setFilterSpec(e.target.value)}
            style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 8, padding: '9px 14px', fontSize: 14, color: filterSpec ? '#fff' : '#595959', outline: 'none', cursor: 'pointer' }}>
            <option value="">All Specializations</option>
            {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => setFilterVerified(v => !v)}
            style={{ padding: '9px 14px', borderRadius: 8, border: `1px solid ${filterVerified ? 'rgba(16,185,129,0.4)' : '#1A1A1A'}`, background: filterVerified ? 'rgba(16,185,129,0.1)' : 'transparent', color: filterVerified ? '#10B981' : '#595959', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            ✓ PRC Verified Only
          </button>
          <span style={{ fontSize: 13, color: '#595959', alignSelf: 'center', marginLeft: 'auto' }}>{filtered.length} broker{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ color: '#595959', fontSize: 14 }}>Loading…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {filtered.map(p => {
              const isConnected = connected.has(p.id)
              const isMe = p.id === myProfile?.id
              return (
                <div key={p.id} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#262626')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#1A1A1A')}
                >
                  {/* Cover */}
                  <div style={{ height: 60, background: p.cover_url ? `url(${p.cover_url}) center/cover` : 'linear-gradient(135deg, #703BF7 0%, #1A1A1A 100%)' }} />
                  <div style={{ padding: '0 16px 16px', marginTop: -20 }}>
                    {/* Avatar */}
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#0D0D0D', border: '3px solid #0D0D0D', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 10 }}>
                      {p.avatar_url ? <img src={p.avatar_url} style={{ width: 52, height: 52, objectFit: 'cover' }} alt="" /> : '👤'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <a href={`/profile/${p.id}`} style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{p.display_name}</a>
                          {p.prc_verified && <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.15)', color: '#10B981', padding: '2px 5px', borderRadius: 99, fontWeight: 600, flexShrink: 0 }}>✓ PRC</span>}
                        </div>
                        <div style={{ fontSize: 12, color: '#595959', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.headline ?? 'Real Estate Professional'}</div>
                        {p.location && <div style={{ fontSize: 12, color: '#595959', marginTop: 2 }}>📍 {p.location}</div>}
                      </div>
                    </div>

                    {p.specializations && p.specializations.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
                        {p.specializations.slice(0, 3).map(s => (
                          <span key={s} style={{ fontSize: 10, background: '#141414', color: '#595959', padding: '2px 7px', borderRadius: 99, border: '1px solid #1A1A1A' }}>{s}</span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 16, marginTop: 12, paddingTop: 10, borderTop: '1px solid #141414' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{p.connection_count}</div>
                        <div style={{ fontSize: 10, color: '#595959' }}>Connections</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{p.listing_count}</div>
                        <div style={{ fontSize: 10, color: '#595959' }}>Listings</div>
                      </div>
                      {p.years_experience && (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{p.years_experience}y</div>
                          <div style={{ fontSize: 10, color: '#595959' }}>Experience</div>
                        </div>
                      )}
                    </div>

                    {!isMe && (
                      <button
                        onClick={() => !isConnected && handleConnect(p.id)}
                        disabled={isConnected || connecting === p.id}
                        style={{ width: '100%', marginTop: 12, padding: '8px 0', borderRadius: 8, border: `1px solid ${isConnected ? '#1A1A1A' : 'rgba(112,59,247,0.4)'}`, background: isConnected ? 'transparent' : 'rgba(112,59,247,0.1)', color: isConnected ? '#595959' : '#703BF7', fontSize: 13, fontWeight: 600, cursor: isConnected ? 'default' : 'pointer' }}
                      >
                        {connecting === p.id ? 'Sending…' : isConnected ? '✓ Connected' : '+ Connect'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
