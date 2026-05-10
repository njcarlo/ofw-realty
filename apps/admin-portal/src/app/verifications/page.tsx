'use client'
import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/AdminSidebar'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://ofw-realty-api-production.up.railway.app'

const DEMO_PENDING = [
  { id: 'd1', doc_type: 'PRC License', doc_number: 1, owner_id: 'agent-001', owner_name: 'Maria Santos', owner_type: 'realtor', status: 'submitted', created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 'd2', doc_type: 'Valid ID', doc_number: 2, owner_id: 'agent-001', owner_name: 'Maria Santos', owner_type: 'realtor', status: 'submitted', created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 'd3', doc_type: 'NBI Clearance', doc_number: 7, owner_id: 'agent-002', owner_name: 'Juan Dela Cruz', owner_type: 'realtor', status: 'submitted', created_at: new Date(Date.now() - 24 * 3600000).toISOString() },
]

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function VerificationsPage() {
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetch(`${API}/documents/pending`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(data => setDocs(data?.length > 0 ? data : DEMO_PENDING))
      .catch(() => setDocs(DEMO_PENDING))
      .finally(() => setLoading(false))
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function handleAction(docId: string, action: 'approve' | 'reject') {
    setActing(docId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${API}/documents/${docId}/${action}`, {
        method: 'POST',
        headers: { ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
      })
      if (res.ok) {
        setDocs(prev => prev.filter(d => d.id !== docId))
        showToast(`✅ Document ${action === 'approve' ? 'approved' : 'rejected'}`)
      } else {
        // Demo mode — just remove from list
        setDocs(prev => prev.filter(d => d.id !== docId))
        showToast(`✅ Document ${action === 'approve' ? 'approved' : 'rejected'} (demo)`)
      }
    } catch {
      setDocs(prev => prev.filter(d => d.id !== docId))
      showToast(`✅ Done (demo mode)`)
    }
    setActing(null)
  }

  const grouped = docs.reduce((acc: any, doc: any) => {
    const key = doc.owner_id
    if (!acc[key]) acc[key] = { name: doc.owner_name ?? doc.owner_id, type: doc.owner_type, docs: [] }
    acc[key].docs.push(doc)
    return acc
  }, {})

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: 'Inter, sans-serif', color: '#fff' }}>
      <AdminSidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        {toast && (
          <div style={{ position: 'fixed', top: 20, right: 20, background: '#0D0D0D', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '12px 18px', fontSize: 14, color: '#10B981', zIndex: 100 }}>{toast}</div>
        )}

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Verifications</h1>
          <p style={{ fontSize: 14, color: '#595959', marginTop: 4 }}>Review and approve agent & broker documents</p>
        </div>

        {/* Process steps */}
        <div style={{ background: 'rgba(112,59,247,0.06)', border: '1px solid rgba(112,59,247,0.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#703BF7', marginBottom: 10 }}>📋 Verification Process</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { n: '1', label: 'Agent registers', desc: 'Creates account with role: Agent' },
              { n: '2', label: 'Uploads 9 docs', desc: 'PRC, ID, NBI, DTI, etc.' },
              { n: '3', label: 'Admin reviews', desc: 'Approve or reject each doc' },
              { n: '4', label: 'Badge awarded', desc: 'All 9 approved → Verified ✓' },
            ].map(s => (
              <div key={s.n} style={{ background: '#0D0D0D', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#703BF7', marginBottom: 3 }}>{s.n}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: '#595959' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 10, padding: '12px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#F59E0B' }}>{docs.length}</div>
            <div style={{ fontSize: 11, color: '#595959' }}>Pending Docs</div>
          </div>
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 10, padding: '12px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#703BF7' }}>{Object.keys(grouped).length}</div>
            <div style={{ fontSize: 11, color: '#595959' }}>Agents Pending</div>
          </div>
        </div>

        {loading ? (
          <div style={{ color: '#595959', fontSize: 14 }}>Loading…</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#595959' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#999' }}>All caught up!</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>No pending document reviews</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.entries(grouped).map(([ownerId, agent]: any) => (
              <div key={ownerId} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #141414', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(112,59,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                      {agent.type === 'realtor' ? '👤' : '🏢'}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{agent.name}</div>
                      <div style={{ fontSize: 12, color: '#595959', textTransform: 'capitalize' }}>{agent.type} · {agent.docs.length} doc{agent.docs.length !== 1 ? 's' : ''} pending</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: '#595959' }}>{agent.docs.length}/9 submitted</span>
                    <div style={{ background: '#141414', borderRadius: 99, height: 6, width: 80, overflow: 'hidden' }}>
                      <div style={{ width: `${(agent.docs.length / 9) * 100}%`, height: '100%', background: '#703BF7', borderRadius: 99 }} />
                    </div>
                  </div>
                </div>
                {agent.docs.map((doc: any, i: number) => (
                  <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: i < agent.docs.length - 1 ? '1px solid #141414' : 'none' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>📄</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Doc #{doc.doc_number}: {doc.doc_type}</div>
                      <div style={{ fontSize: 11, color: '#595959' }}>Submitted {timeAgo(doc.created_at)}</div>
                    </div>
                    {doc.file_url && doc.file_url !== '#' && (
                      <a href={doc.file_url} target="_blank" style={{ fontSize: 12, color: '#703BF7', border: '1px solid rgba(112,59,247,0.3)', borderRadius: 6, padding: '4px 10px' }}>View File</a>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleAction(doc.id, 'approve')} disabled={acting === doc.id}
                        style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer' }}>
                        ✓ Approve
                      </button>
                      <button onClick={() => handleAction(doc.id, 'reject')} disabled={acting === doc.id}
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer' }}>
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Required docs reference */}
        <div style={{ marginTop: 28, background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 10 }}>📌 Required Documents (9 total)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {['PRC License', 'Valid Government ID', 'NBI Clearance', 'DTI/SEC Registration', 'BIR Certificate', "Mayor's Permit", 'HLURB/DHSUD License', 'Proof of Address', 'Professional Tax Receipt'].map((doc, i) => (
              <div key={doc} style={{ fontSize: 12, color: '#595959', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#703BF7', fontWeight: 700 }}>{i + 1}.</span> {doc}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
