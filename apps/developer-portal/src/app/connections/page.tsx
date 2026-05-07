'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DeveloperSidebar } from '@/components/DeveloperSidebar'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export default function ConnectionsPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [connections, setConnections] = useState<any[]>([])
  const [pending, setPending] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const t = data.session?.access_token
      if (!t) { router.replace('/onboarding'); return }
      setToken(t)
      const res = await fetch(`${API}/api/broker-connections`, { headers: { Authorization: `Bearer ${t}` } })
      if (res.ok) {
        const all = await res.json()
        setConnections(all.filter((c: any) => c.status === 'active'))
        setPending(all.filter((c: any) => c.status === 'pending'))
      }
      setLoading(false)
    })
  }, [router])

  async function handleAccept(id: string) {
    if (!token) return
    setActing(id)
    const res = await fetch(`${API}/api/broker-connections/${id}/accept`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const updated = await res.json()
      setPending(p => p.filter(c => c.id !== id))
      setConnections(c => [...c, updated])
    }
    setActing(null)
  }

  async function handleDecline(id: string) {
    if (!token) return
    setActing(id)
    await fetch(`${API}/api/broker-connections/${id}/decline`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
    })
    setPending(p => p.filter(c => c.id !== id))
    setActing(null)
  }

  async function handleTerminate(id: string) {
    if (!confirm('Terminate this broker connection? This will revoke their access to your inventory.')) return
    if (!token) return
    setActing(id)
    await fetch(`${API}/api/broker-connections/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    })
    setConnections(c => c.filter(conn => conn.id !== id))
    setActing(null)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <DeveloperSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Broker Network</h1>
          <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>{connections.length} active connection{connections.length !== 1 ? 's' : ''}</p>
        </div>

        {loading ? (
          <div style={{ color: '#595959', fontSize: 14 }}>Loading…</div>
        ) : (
          <>
            {/* Incoming requests */}
            {pending.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 14 }}>
                  Incoming Requests <span style={{ fontSize: 13, background: 'rgba(245,158,11,0.15)', color: '#F59E0B', borderRadius: 99, padding: '2px 8px', marginLeft: 8 }}>{pending.length}</span>
                </h2>
                <div style={{ background: '#0D0D0D', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, overflow: 'hidden' }}>
                  {pending.map((req: any, i: number) => (
                    <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderBottom: i < pending.length - 1 ? '1px solid #141414' : 'none' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(112,59,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏢</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{req.broker_name ?? 'Broker'}</div>
                        <div style={{ fontSize: 12, color: '#595959' }}>Requested {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'recently'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleAccept(req.id)} disabled={acting === req.id}
                          style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer' }}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDecline(req.id)} disabled={acting === req.id}
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer' }}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active connections */}
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 14 }}>Active Connections</h2>
              {connections.length === 0 ? (
                <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 40, textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🤝</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 8 }}>No active connections</div>
                  <p style={{ fontSize: 14, color: '#595959', marginBottom: 20 }}>Connect with brokers to start selling your inventory.</p>
                  <a href="/brokers" style={{ background: '#703BF7', color: '#fff', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600 }}>Find Brokers</a>
                </div>
              ) : (
                <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 100px 100px 1fr', padding: '10px 20px', borderBottom: '1px solid #141414' }}>
                    {['Broker', 'Agents', 'Reserved', 'Sold', 'Actions'].map(h => (
                      <div key={h} style={{ fontSize: 11, color: '#595959', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
                    ))}
                  </div>
                  {connections.map((c: any, i: number) => (
                    <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 100px 100px 1fr', padding: '16px 20px', borderBottom: i < connections.length - 1 ? '1px solid #141414' : 'none', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{c.broker_name ?? 'Broker'}</div>
                        <div style={{ fontSize: 12, color: '#595959' }}>Connected {c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}</div>
                      </div>
                      <div style={{ fontSize: 13, color: '#999' }}>{c.agent_count ?? 0}</div>
                      <div style={{ fontSize: 13, color: '#F59E0B', fontWeight: 600 }}>{c.units_reserved ?? 0}</div>
                      <div style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>{c.units_sold ?? 0}</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <a href={`/connections/${c.id}`} style={{ background: 'rgba(112,59,247,0.15)', color: '#703BF7', border: '1px solid rgba(112,59,247,0.2)', borderRadius: 8, padding: '6px 12px', fontSize: 12 }}>
                          Configure Commission
                        </a>
                        <button
                          onClick={() => handleTerminate(c.id)} disabled={acting === c.id}
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}
                        >
                          Terminate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
