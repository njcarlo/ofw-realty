'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Sidebar } from '@/components/Sidebar'
import type { B2BProfile, B2BPost, B2BServiceOffer } from '@/lib/types'

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000'

function formatPHP(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  return `₱${(n / 1000).toFixed(0)}K`
}

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [myProfile, setMyProfile] = useState<B2BProfile | null>(null)
  const [profile, setProfile] = useState<B2BProfile | null>(null)
  const [posts, setPosts] = useState<B2BPost[]>([])
  const [services, setServices] = useState<B2BServiceOffer[]>([])
  const [listings, setListings] = useState<any[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted'>('none')
  const [connecting, setConnecting] = useState(false)
  const [tab, setTab] = useState<'posts' | 'listings' | 'services'>('posts')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session
      if (!session) { router.replace('/login'); return }
      const { data: me } = await supabase.from('b2b_profiles').select('*').eq('user_id', session.user.id).maybeSingle()
      setMyProfile(me)

      const [{ data: prof }, { data: profPosts }, { data: profServices }, { data: profListings }] = await Promise.all([
        supabase.from('b2b_profiles').select('*').eq('id', id).single(),
        supabase.from('b2b_posts').select('*, listing:listings(id, title, price_php, city, province, property_type, listing_photos(url, is_primary))').eq('author_id', id).order('created_at', { ascending: false }).limit(10),
        supabase.from('b2b_service_offers').select('*').eq('profile_id', id).eq('is_active', true),
        supabase.from('b2b_listing_shares').select('*, listing:listings(id, title, price_php, city, province, property_type, lot_area_sqm, listing_photos(url, is_primary))').eq('profile_id', id).limit(6),
      ])

      setProfile(prof)
      setPosts(profPosts ?? [])
      setServices(profServices ?? [])
      setListings(profListings ?? [])

      // Check connection status
      if (me && prof) {
        const { data: conn } = await supabase.from('b2b_connections')
          .select('status').or(`and(requester_id.eq.${me.id},addressee_id.eq.${prof.id}),and(requester_id.eq.${prof.id},addressee_id.eq.${me.id})`).maybeSingle()
        if (conn) setConnectionStatus(conn.status === 'accepted' ? 'accepted' : 'pending')
      }
      setLoading(false)
    })
  }, [id, router])

  async function handleConnect() {
    if (!myProfile || !profile) return
    setConnecting(true)
    await supabase.from('b2b_connections').insert({ requester_id: myProfile.id, addressee_id: profile.id, status: 'pending' })
    setConnectionStatus('pending')
    setConnecting(false)
  }

  const isMe = myProfile?.id === id

  if (loading) return <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#595959', fontFamily: 'Inter, sans-serif' }}>Loading…</div>
  if (!profile) return <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', fontFamily: 'Inter, sans-serif' }}>Profile not found.</div>

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: 'Inter, sans-serif', color: '#fff' }}>
      <Sidebar profile={myProfile ?? undefined} />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {/* Cover */}
        <div style={{ height: 160, background: profile.cover_url ? `url(${profile.cover_url}) center/cover` : 'linear-gradient(135deg, #703BF7 0%, #1A1A1A 100%)', position: 'relative' }} />

        <div style={{ padding: '0 32px 32px', maxWidth: 860, margin: '0 auto' }}>
          {/* Avatar + actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: -36, marginBottom: 20 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#0D0D0D', border: '4px solid #000', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
              {profile.avatar_url ? <img src={profile.avatar_url} style={{ width: 80, height: 80, objectFit: 'cover' }} alt="" /> : '👤'}
            </div>
            <div style={{ display: 'flex', gap: 10, paddingBottom: 4 }}>
              {isMe ? (
                <a href="/profile/setup" style={{ background: 'transparent', color: '#703BF7', border: '1px solid rgba(112,59,247,0.4)', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>Edit Profile</a>
              ) : (
                <>
                  {connectionStatus === 'accepted' && (
                    <a href={`/messages?to=${profile.id}`} style={{ background: 'rgba(112,59,247,0.1)', color: '#703BF7', border: '1px solid rgba(112,59,247,0.3)', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>💬 Message</a>
                  )}
                  <button onClick={connectionStatus === 'none' ? handleConnect : undefined} disabled={connecting || connectionStatus !== 'none'}
                    style={{ background: connectionStatus === 'accepted' ? 'transparent' : '#703BF7', color: connectionStatus === 'accepted' ? '#595959' : '#fff', border: connectionStatus === 'accepted' ? '1px solid #1A1A1A' : 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: connectionStatus === 'none' ? 'pointer' : 'default', boxShadow: connectionStatus === 'none' ? '0 0 16px rgba(112,59,247,0.3)' : 'none' }}>
                    {connecting ? 'Sending…' : connectionStatus === 'accepted' ? '✓ Connected' : connectionStatus === 'pending' ? '⏳ Pending' : '+ Connect'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Profile info */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>{profile.display_name}</h1>
              {profile.prc_verified && (
                <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99, border: '1px solid rgba(16,185,129,0.3)' }}>✓ PRC Verified</span>
              )}
            </div>
            {profile.headline && <p style={{ fontSize: 15, color: '#ccc', marginBottom: 8 }}>{profile.headline}</p>}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#595959' }}>
              {profile.location && <span>📍 {profile.location}</span>}
              {profile.years_experience && <span>🏆 {profile.years_experience} years experience</span>}
              {profile.prc_license_type && <span>🪪 PRC {profile.prc_license_type}</span>}
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
              {[
                { label: 'Connections', value: profile.connection_count },
                { label: 'Listings Shared', value: profile.listing_count },
                { label: 'Posts', value: profile.post_count },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#595959' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {profile.bio && <p style={{ fontSize: 14, color: '#999', lineHeight: 1.7, marginTop: 16, maxWidth: 600 }}>{profile.bio}</p>}

            {/* Specializations */}
            {profile.specializations && profile.specializations.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {profile.specializations.map(s => <span key={s} style={{ fontSize: 12, background: '#141414', color: '#999', padding: '4px 10px', borderRadius: 99, border: '1px solid #1A1A1A' }}>{s}</span>)}
              </div>
            )}

            {/* Social links */}
            {profile.social_links && Object.values(profile.social_links).some(Boolean) && (
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                {profile.social_links.facebook && <a href={profile.social_links.facebook} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#595959' }}>📘 Facebook</a>}
                {profile.social_links.instagram && <a href={profile.social_links.instagram} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#595959' }}>📸 Instagram</a>}
                {profile.social_links.linkedin && <a href={profile.social_links.linkedin} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#595959' }}>💼 LinkedIn</a>}
                {profile.website_url && <a href={profile.website_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#703BF7' }}>🌐 Website</a>}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 10, padding: 4, marginBottom: 24, width: 'fit-content' }}>
            {[{ key: 'posts', label: `Posts (${posts.length})` }, { key: 'listings', label: `Listings (${listings.length})` }, { key: 'services', label: `Services (${services.length})` }].map(t => (
              <button key={t.key} onClick={() => setTab(t.key as any)}
                style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: tab === t.key ? '#1A1A1A' : 'transparent', color: tab === t.key ? '#fff' : '#595959', fontSize: 13, fontWeight: tab === t.key ? 600 : 400, cursor: 'pointer' }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Posts */}
          {tab === 'posts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {posts.length === 0 && <div style={{ color: '#595959', fontSize: 14, padding: '20px 0' }}>No posts yet.</div>}
              {posts.map(p => (
                <div key={p.id} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 18 }}>
                  <p style={{ fontSize: 14, color: '#ccc', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: p.listing ? 12 : 0 }}>{p.content}</p>
                  {p.listing && (
                    <a href={`${WEB_URL}/listings/${p.listing.id}`} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', gap: 10, background: '#141414', border: '1px solid #262626', borderRadius: 8, padding: 10 }}>
                      <div style={{ width: 60, height: 48, borderRadius: 6, background: '#0D0D0D', overflow: 'hidden', flexShrink: 0 }}>
                        {p.listing.listing_photos?.[0] && <img src={p.listing.listing_photos[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{p.listing.title}</div>
                        <div style={{ fontSize: 12, color: '#595959' }}>📍 {p.listing.city} · {formatPHP(p.listing.price_php)}</div>
                      </div>
                    </a>
                  )}
                  <div style={{ fontSize: 12, color: '#595959', marginTop: 10 }}>
                    {new Date(p.created_at).toLocaleDateString('en-PH', { dateStyle: 'medium' })} · {p.reaction_count} reactions · {p.comment_count} comments
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Listings */}
          {tab === 'listings' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
              {listings.length === 0 && <div style={{ color: '#595959', fontSize: 14, gridColumn: '1/-1' }}>No listings shared yet.</div>}
              {listings.map(s => {
                const l = s.listing
                const photo = l?.listing_photos?.find((p: any) => p.is_primary) ?? l?.listing_photos?.[0]
                return (
                  <a key={s.id} href={`${WEB_URL}/listings/${l?.id}`} target="_blank" rel="noopener noreferrer"
                    style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden', display: 'block' }}>
                    <div style={{ height: 120, background: '#141414' }}>
                      {photo && <img src={photo.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l?.title}</div>
                      <div style={{ fontSize: 12, color: '#595959' }}>📍 {l?.city}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#703BF7', marginTop: 6 }}>{l ? formatPHP(l.price_php) : '—'}</div>
                      {s.co_broke && <div style={{ fontSize: 10, color: '#F59E0B', marginTop: 4 }}>🤝 Co-Broke Available {s.commission_split ? `· ${s.commission_split}%` : ''}</div>}
                    </div>
                  </a>
                )
              })}
            </div>
          )}

          {/* Services */}
          {tab === 'services' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {services.length === 0 && <div style={{ color: '#595959', fontSize: 14 }}>No services offered yet.</div>}
              {services.map(s => (
                <div key={s.id} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 18 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: '#595959', lineHeight: 1.6, marginBottom: 10 }}>{s.description}</div>
                  {s.coverage_areas && s.coverage_areas.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {s.coverage_areas.map(a => <span key={a} style={{ fontSize: 11, background: '#141414', color: '#595959', padding: '2px 8px', borderRadius: 99, border: '1px solid #1A1A1A' }}>📍 {a}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
