'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DeveloperSidebar } from '@/components/DeveloperSidebar'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export default function InHouseAgentsPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteSearch, setInviteSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [inviting, setInviting] = useState<string | null>(null)
  const [invited, setInvited] = useState<Set<string>>(new Set())
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const t = data.session?.access_token
      if (!t) { router.replace('/onboarding'); return }
      setToken(t)
      const res = await fetch(`${API}/api/in-house-agents`, { headers: { Authorization: `Bearer ${t}` } })
      if (res.ok) setAgents(await res.json())
      setLoading(false)
    })
  }, [router])

  async function handleSearch() {
    if (!token || !inviteSearch.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`${API}/api/realtors/search?q=${encodeURIComponent(inviteSearch)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setSearchResults(await res.json())
    } finally {
      setSearching(false)
    }
  }

  async function handleInvite(realtorId: string) {
    if (!token) return
    setInviting(realtorId)
    try {
      const res = await fetch(`${API}/api/in-house-agents/invite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ realtor_id: realtorId }),
      })
      if (res.ok) setInvited(s => new Set([...s, realtorId]))
    } finally {
      setInviting(null)
    }
  }

  async function handleRemove(tagId: string) {
    if (!confirm('Remove this agent tag? The developer tag will be removed from their profile and listings.')) return
    if (!token) return
    setRemoving(tagId)
    await fetch(`${API}/api/in-house-agents/${tagId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    })
    setAgents(a => a.filter(ag => ag.id !== tagId))
    setRemoving(null)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <DeveloperSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>In-House Agents</h1>
            <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>{agents.length} tagged agent{agents.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            style={{ background: '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 20px rgba(112,59,247,0.3)' }}
          >
            + Invite Agent
          </button>
        </div>

        {loading ? (
          <div style={{ color: '#595959', fontSize: 14 }}>Loading…</div>
        ) : agents.length === 0 ? (
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>No in-house agents yet</div>
            <p style={{ fontSize: 14, color: '#595959', marginBottom: 24 }}>Tag agents as your official sales representatives.</p>
            <button onClick={() => setShowInviteModal(true)} style={{ background: '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              + Invite Agent
            </button>
          </div>
        ) : (
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 100px 100px 100px 80px', padding: '10px 20px', borderBottom: '1px solid #141414' }}>
              {['Agent', 'Status', 'Listings', 'Reserved', 'Sold', 'Actions'].map(h => (
                <div key={h} style={{ fontSize: 11, color: '#595959', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
              ))}
            </div>
            {agents.map((a: any, i: number) => (
              <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 100px 100px 100px 80px', padding: '16px 20px', borderBottom: i < agents.length - 1 ? '1px solid #141414' : 'none', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{a.agent_name ?? a.realtor_name}</div>
                  <div style={{ fontSize: 12, color: '#595959' }}>{a.email}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: a.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: a.status === 'active' ? '#10B981' : '#F59E0B', textTransform: 'capitalize', display: 'inline-block' }}>
                  {a.status}
                </span>
                <div style={{ fontSize: 13, color: '#999' }}>{a.active_listings ?? 0}</div>
                <div style={{ fontSize: 13, color: '#F59E0B', fontWeight: 600 }}>{a.units_reserved ?? 0}</div>
                <div style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>{a.units_sold ?? 0}</div>
                <button
                  onClick={() => handleRemove(a.id)} disabled={removing === a.id}
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}
                >
                  Remove Tag
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Invite modal */}
        {showInviteModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 16, padding: 32, maxWidth: 500, width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Invite Agent</h2>
                <button onClick={() => { setShowInviteModal(false); setInviteSearch(''); setSearchResults([]) }} style={{ background: 'none', border: 'none', color: '#595959', fontSize: 20, cursor: 'pointer' }}>×</button>
              </div>
              <p style={{ fontSize: 14, color: '#595959', marginBottom: 20 }}>Search for agents by name or email to send them an in-house agent invitation.</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                  type="text" placeholder="Search by name or email…"
                  value={inviteSearch} onChange={e => setInviteSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  style={{ flex: 1, background: '#141414', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#fff', outline: 'none' }}
                />
                <button onClick={handleSearch} disabled={searching} style={{ background: '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 14, cursor: 'pointer' }}>
                  {searching ? '…' : 'Search'}
                </button>
              </div>
              {searchResults.length > 0 && (
                <div style={{ background: '#141414', borderRadius: 10, overflow: 'hidden' }}>
                  {searchResults.map((agent: any, i: number) => (
                    <div key={agent.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < searchResults.length - 1 ? '1px solid #1A1A1A' : 'none' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(112,59,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>👤</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{agent.full_name}</div>
                        <div style={{ fontSize: 12, color: '#595959' }}>{agent.email}</div>
                      </div>
                      <button
                        onClick={() => handleInvite(agent.id)}
                        disabled={inviting === agent.id || invited.has(agent.id)}
                        style={{
                          background: invited.has(agent.id) ? 'rgba(16,185,129,0.1)' : 'rgba(112,59,247,0.15)',
                          color: invited.has(agent.id) ? '#10B981' : '#703BF7',
                          border: `1px solid ${invited.has(agent.id) ? 'rgba(16,185,129,0.2)' : 'rgba(112,59,247,0.2)'}`,
                          borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: (inviting === agent.id || invited.has(agent.id)) ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {invited.has(agent.id) ? '✓ Invited' : inviting === agent.id ? '…' : 'Invite'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {searchResults.length === 0 && inviteSearch && !searching && (
                <div style={{ color: '#595959', fontSize: 14, textAlign: 'center', padding: '16px 0' }}>No agents found. Try a different search.</div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
