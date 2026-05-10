'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Sidebar } from '@/components/Sidebar'
import type { B2BProfile, B2BConnection } from '@/lib/types'

export default function NetworkPage() {
  const router = useRouter()
  const [myProfile, setMyProfile] = useState<B2BProfile | null>(null)
  const [connections, setConnections] = useState<B2BConnection[]>([])
  const [pending, setPending] = useState<B2BConnection[]>([])
  const [sent, setSent] = useState<B2BConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'connections' | 'pending' | 'sent'>('connections')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session
      if (!session) { router.replace('/login'); return }
      const { data: prof } = await supabase.from('b2b_profiles').select('*').eq('user_id', session.user.id).maybeSingle()
      if (!prof) { router.replace('/profile/setup'); return }
      setMyProfile(prof)

      // Accepted connections
      const { data: accepted } = await supabase.from('b2b_connections')
        .select('*, profile:b2b_profiles!addressee_id(*)')
        .eq('requester_id', prof.id).eq('status', 'accepted')
      const { data: acceptedBy } = await supabase.from('b2b_connections')
        .select('*, profile:b2b_profiles!requester_id(*)')
        .eq('addressee_id', prof.id).eq('status', 'accepted')
      setConnections([...(accepted ?? []), ...(acceptedBy ?? [])])

      // Pending (received)
      const { data: pendingData } = await supabase.from('b2b_connections')
        .select('*, profile:b2b_profiles!requester_id(*)')
        .eq('addressee_id', prof.id).eq('status', 'pending')
      setPending(pendingData ?? [])

      // Sent
      const { data: sentData } = await supabase.from('b2b_connections')
        .select('*, profile:b2b_profiles!addressee_id(*)')
        .eq('requester_id', prof.id).eq('status', 'pending')
      setSent(sentData ?? [])

      setLoading(false)
    })
  }, [router])

  async function handleAccept(connId: string) {
    await supabase.from('b2b_connections').update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', connId)
    const conn = pending.find(c => c.id === connId)
    if (conn) {
      setPending(prev => prev.filter(c => c.id !== connId))
      setConnections(prev => [...prev, { ...conn, status: 'accepted' }])
      // Update connection counts
      if (myProfile) await supabase.from('b2b_profiles').update({ connection_count: (myProfile.connection_count ?? 0) + 1 }).eq('id', myProfile.id)
    }
  }

  async function handleDecline(connId: string) {
    await supabase.from('b2b_connections').update({ status: 'declined' }).eq('id', connId)
    setPending(prev => prev.filter(c => c.id !== connId))
  }

  async function handleWithdraw(connId: string) {
    await supabase.from('b2b_connections').update({ status: 'withdrawn' }).eq('id', connId)
    setSent(prev => prev.filter(c => c.id !== connId))
  }

  function ProfileRow({ conn, actions }: { conn: B2BConnection; actions?: React.ReactNode }) {
    const p = conn.profile
    if (!p) return null
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid #141414' }}>
        <a href={`/profile/${p.id}`} style={{ flexShrink: 0 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(112,59,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, overflow: 'hidden' }}>
            {p.avatar_url ? <img src={p.avatar_url} style={{ width: 48, height: 48, objectFit: 'cover' }} alt="" /> : '👤'}
          </div>
        </a>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <a href={`/profile/${p.id}`} style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{p.display_name}</a>
            {p.prc_verified && <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.15)', color: '#10B981', padding: '2px 5px', borderRadius: 99, fontWeight: 600 }}>✓ PRC</span>}
          </div>
          <div style={{ fontSize: 12, color: '#595959', marginTop: 2 }}>{p.headline ?? 'Real Estate Professional'}</div>
          {p.location && <div style={{ fontSize: 12, color: '#595959' }}>📍 {p.location}</div>}
        </div>
        {actions}
      </div>
    )
  }

  const TABS = [
    { key: 'connections', label: `Connections (${connections.length})` },
    { key: 'pending', label: `Pending (${pending.length})`, badge: pending.length > 0 },
    { key: 'sent', label: `Sent (${sent.length})` },
  ] as const
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: 'Inter, sans-serif', color: '#fff' }}>
      <Sidebar profile={myProfile ?? undefined} />
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>My Network</h1>
            <p style={{ fontSize: 14, color: '#595959', marginTop: 4 }}>Manage your broker connections</p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: tab === t.key ? '#1A1A1A' : 'transparent', color: tab === t.key ? '#fff' : '#595959', fontSize: 13, fontWeight: tab === t.key ? 600 : 400, cursor: 'pointer', position: 'relative' }}>
                {t.label}
                {('badge' in t) && t.badge && <span style={{ position: 'absolute', top: 4, right: 8, width: 8, height: 8, borderRadius: '50%', background: '#703BF7' }} />}
              </button>
            ))}
          </div>

          {loading ? <div style={{ color: '#595959', fontSize: 14 }}>Loading…</div> : (
            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, padding: '0 20px' }}>
              {tab === 'connections' && (
                connections.length === 0
                  ? <div style={{ padding: '40px 0', textAlign: 'center', color: '#595959' }}>No connections yet. <a href="/discover" style={{ color: '#703BF7' }}>Discover brokers →</a></div>
                  : connections.map(c => <ProfileRow key={c.id} conn={c} actions={
                    <a href={`/messages?to=${c.profile?.id}`} style={{ fontSize: 12, color: '#703BF7', border: '1px solid rgba(112,59,247,0.3)', borderRadius: 6, padding: '5px 10px' }}>Message</a>
                  } />)
              )}
              {tab === 'pending' && (
                pending.length === 0
                  ? <div style={{ padding: '40px 0', textAlign: 'center', color: '#595959' }}>No pending requests.</div>
                  : pending.map(c => <ProfileRow key={c.id} conn={c} actions={
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleAccept(c.id)} style={{ fontSize: 12, background: '#703BF7', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 600 }}>Accept</button>
                      <button onClick={() => handleDecline(c.id)} style={{ fontSize: 12, background: 'transparent', color: '#595959', border: '1px solid #1A1A1A', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>Decline</button>
                    </div>
                  } />)
              )}
              {tab === 'sent' && (
                sent.length === 0
                  ? <div style={{ padding: '40px 0', textAlign: 'center', color: '#595959' }}>No sent requests.</div>
                  : sent.map(c => <ProfileRow key={c.id} conn={c} actions={
                    <button onClick={() => handleWithdraw(c.id)} style={{ fontSize: 12, color: '#595959', border: '1px solid #1A1A1A', borderRadius: 6, padding: '5px 10px', background: 'transparent', cursor: 'pointer' }}>Withdraw</button>
                  } />)
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
