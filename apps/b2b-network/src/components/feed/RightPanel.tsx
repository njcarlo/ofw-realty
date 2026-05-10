'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { B2BProfile } from '@/lib/types'
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000'

function formatPHP(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  return `₱${(n / 1000).toFixed(0)}K`
}

interface Props {
  myProfile: B2BProfile | null
}

export function RightPanel({ myProfile }: Props) {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [listings, setListings] = useState<any[]>([])
  const [connecting, setConnecting] = useState<string | null>(null)
  const [connected, setConnected] = useState<Set<string>>(new Set())

  useEffect(() => {
    // People you may know
    supabase.from('b2b_profiles')
      .select('id, display_name, headline, avatar_url, prc_verified, location, connection_count')
      .eq('is_active', true)
      .neq('id', myProfile?.id ?? '')
      .order('prc_verified', { ascending: false })
      .order('connection_count', { ascending: false })
      .limit(5)
      .then(({ data }) => setSuggestions(data ?? []))

    // Latest listings from the main DB
    supabase.from('listings')
      .select('id, title, price_php, city, province, property_type, listing_photos(url, is_primary)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data }) => setListings(data ?? []))
  }, [myProfile?.id])

  async function handleConnect(targetId: string) {
    if (!myProfile) return
    setConnecting(targetId)
    await supabase.from('b2b_connections').insert({
      requester_id: myProfile.id,
      addressee_id: targetId,
      status: 'pending',
    })
    setConnected(prev => new Set([...prev, targetId]))
    setConnecting(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Profile completion / PRC CTA */}
      {myProfile && !myProfile.prc_verified && (
        <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#10B981', marginBottom: 6 }}>🔐 Get PRC Verified</div>
          <p style={{ fontSize: 12, color: '#595959', lineHeight: 1.6, marginBottom: 10 }}>
            Verified brokers get a badge on all posts and profiles — builds instant trust with the network.
          </p>
          <a href="/verify" style={{ display: 'block', textAlign: 'center', background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '7px 0', fontSize: 12, fontWeight: 600 }}>
            Verify Now →
          </a>
        </div>
      )}

      {/* People you may know */}
      {suggestions.length > 0 && (
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14 }}>People You May Know</div>
          {suggestions.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <a href={`/profile/${p.id}`} style={{ flexShrink: 0 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(112,59,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, overflow: 'hidden' }}>
                  {p.avatar_url ? <img src={p.avatar_url} style={{ width: 38, height: 38, objectFit: 'cover' }} alt="" /> : '👤'}
                </div>
              </a>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <a href={`/profile/${p.id}`} style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.display_name}</a>
                  {p.prc_verified && <span style={{ fontSize: 9, color: '#10B981', flexShrink: 0 }}>✓</span>}
                </div>
                <div style={{ fontSize: 11, color: '#595959', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.headline ?? 'Real Estate Professional'}</div>
              </div>
              <button
                onClick={() => !connected.has(p.id) && handleConnect(p.id)}
                disabled={connected.has(p.id) || connecting === p.id}
                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 99, border: `1px solid ${connected.has(p.id) ? '#1A1A1A' : 'rgba(112,59,247,0.4)'}`, background: connected.has(p.id) ? 'transparent' : 'rgba(112,59,247,0.1)', color: connected.has(p.id) ? '#595959' : '#703BF7', cursor: connected.has(p.id) ? 'default' : 'pointer', fontWeight: 600, flexShrink: 0 }}>
                {connecting === p.id ? '…' : connected.has(p.id) ? '✓' : '+ Connect'}
              </button>
            </div>
          ))}
          <a href="/discover" style={{ display: 'block', textAlign: 'center', fontSize: 12, color: '#703BF7', marginTop: 4 }}>See all brokers →</a>
        </div>
      )}

      {/* Latest listings */}
      {listings.length > 0 && (
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Latest Listings</div>
            <a href={WEB_URL} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#703BF7' }}>View all ↗</a>
          </div>
          {listings.map(l => {
            const photo = l.listing_photos?.find((p: any) => p.is_primary) ?? l.listing_photos?.[0]
            return (
              <a key={l.id} href={`${WEB_URL}/listings/${l.id}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', gap: 10, marginBottom: 12, padding: '8px', borderRadius: 8, background: 'transparent', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#141414')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ width: 52, height: 40, borderRadius: 6, background: '#141414', overflow: 'hidden', flexShrink: 0 }}>
                  {photo && <img src={photo.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                  <div style={{ fontSize: 11, color: '#595959' }}>📍 {l.city}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#703BF7' }}>{formatPHP(l.price_php)}</div>
                </div>
              </a>
            )
          })}
        </div>
      )}

      {/* Quick links */}
      <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Quick Actions</div>
        {[
          { label: '🏘️ Share a Listing', href: '/listings' },
          { label: '🤝 Post Co-Broking Request', href: '/feed' },
          { label: '🛠️ Offer a Service', href: '/services' },
          { label: '🔍 Find Brokers', href: '/discover' },
          { label: '💬 My Messages', href: '/messages' },
        ].map(l => (
          <a key={l.href} href={l.href}
            style={{ display: 'block', fontSize: 12, color: '#999', padding: '6px 0', borderBottom: '1px solid #141414', transition: 'color 0.1s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#999')}
          >{l.label}</a>
        ))}
      </div>
    </div>
  )
}
