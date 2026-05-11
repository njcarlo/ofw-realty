const API = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'https://ofw-realty-api-production.up.railway.app'

const DEMO_PENDING = [
  { id: 'd1', doc_type: 'PRC License', doc_number: 1, owner_id: 'agent-001', owner_name: 'Maria Santos', owner_type: 'realtor', status: 'submitted', created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 'd2', doc_type: 'Valid ID', doc_number: 2, owner_id: 'agent-001', owner_name: 'Maria Santos', owner_type: 'realtor', status: 'submitted', created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 'd3', doc_type: 'NBI Clearance', doc_number: 7, owner_id: 'agent-002', owner_name: 'Juan Dela Cruz', owner_type: 'realtor', status: 'submitted', created_at: new Date(Date.now() - 24 * 3600000).toISOString() },
]

async function getPendingDocs(): Promise<{ docs: any[]; isDemo: boolean }> {
  try {
    const res = await fetch(`${API}/documents/pending`, { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      if (data.length > 0) return { docs: data, isDemo: false }
    }
  } catch {}
  return { docs: DEMO_PENDING, isDemo: true }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default async function AdminVerificationsPage() {
  const { docs: pendingDocs, isDemo } = await getPendingDocs()

  const grouped = pendingDocs.reduce((acc: any, doc: any) => {
    const key = doc.owner_id
    if (!acc[key]) acc[key] = { name: doc.owner_name ?? doc.owner_id, type: doc.owner_type, docs: [] }
    acc[key].docs.push(doc)
    return acc
  }, {})

  return (
    <div style={{ padding: 32, color: '#fff', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Verifications</h1>
          <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>Agent & Broker document review queue</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 10, padding: '10px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#F59E0B' }}>{pendingDocs.length}</div>
            <div style={{ fontSize: 11, color: '#595959' }}>Pending Docs</div>
          </div>
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 10, padding: '10px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#703BF7' }}>{Object.keys(grouped).length}</div>
            <div style={{ fontSize: 11, color: '#595959' }}>Agents Pending</div>
          </div>
        </div>
      </div>

      {/* Demo mode banner */}
      {isDemo && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#F59E0B' }}>Demo Mode</span>
            <span style={{ fontSize: 13, color: '#595959', marginLeft: 8 }}>
              Could not reach the API — showing sample data. Real submissions will appear here once the API is connected.
            </span>
          </div>
        </div>
      )}

      {/* Verification process explainer */}
      <div style={{ background: 'rgba(112,59,247,0.06)', border: '1px solid rgba(112,59,247,0.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 28 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#703BF7', marginBottom: 8 }}>📋 Verification Process</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { step: '1', label: 'Agent registers', desc: 'Creates account with role: Agent' },
            { step: '2', label: 'Uploads 9 docs', desc: 'PRC, ID, NBI, DTI, etc.' },
            { step: '3', label: 'Admin reviews', desc: 'Approve or reject each doc' },
            { step: '4', label: 'Badge awarded', desc: 'All 9 approved → Verified ✓' },
          ].map(s => (
            <div key={s.step} style={{ background: '#0D0D0D', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#703BF7', marginBottom: 4 }}>{s.step}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: '#595959' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending reviews */}
      <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>
        Pending Document Reviews
        {pendingDocs.length > 0 && (
          <span style={{ marginLeft: 10, background: 'rgba(239,68,68,0.15)', color: '#EF4444', fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 99 }}>
            {pendingDocs.length} pending
          </span>
        )}
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#595959' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#999' }}>All caught up!</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>No pending document reviews</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Object.entries(grouped).map(([ownerId, agent]: any) => (
            <div key={ownerId} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #141414', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(112,59,247,0.1)', border: '1px solid rgba(112,59,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    {agent.type === 'realtor' ? '👤' : '🏢'}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{agent.name}</div>
                    <div style={{ fontSize: 12, color: '#595959', textTransform: 'capitalize' }}>{agent.type} · {agent.docs.length} document{agent.docs.length !== 1 ? 's' : ''} pending</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#595959' }}>{agent.docs.length}/9 docs submitted</span>
                  <div style={{ background: '#141414', borderRadius: 99, height: 6, width: 80, overflow: 'hidden' }}>
                    <div style={{ width: `${(agent.docs.length / 9) * 100}%`, height: '100%', background: '#703BF7', borderRadius: 99 }} />
                  </div>
                </div>
              </div>

              {agent.docs.map((doc: any, i: number) => (
                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: i < agent.docs.length - 1 ? '1px solid #141414' : 'none' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                    📄
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Doc #{doc.doc_number}: {doc.doc_type}</div>
                    <div style={{ fontSize: 12, color: '#595959', marginTop: 2 }}>Submitted {timeAgo(doc.created_at)}</div>
                  </div>
                  {doc.file_url && doc.file_url !== '#' && (
                    <a href={doc.file_url} target="_blank" style={{ fontSize: 12, color: '#703BF7', textDecoration: 'none', border: '1px solid rgba(112,59,247,0.3)', borderRadius: 6, padding: '4px 10px' }}>
                      View File
                    </a>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a href={`/api/documents/${doc.id}/approve`} style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8, textDecoration: 'none', border: '1px solid rgba(16,185,129,0.3)' }}>
                      ✓ Approve
                    </a>
                    <a href={`/api/documents/${doc.id}/reject`} style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8, textDecoration: 'none', border: '1px solid rgba(239,68,68,0.3)' }}>
                      ✗ Reject
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Required docs reference */}
      <div style={{ marginTop: 32, background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 12 }}>📌 Required Documents (9 total)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {['PRC License', 'Valid Government ID', 'NBI Clearance', 'DTI/SEC Registration', 'BIR Certificate', "Mayor's Permit", 'HLURB/DHSUD License', 'Proof of Address', 'Professional Tax Receipt'].map((doc, i) => (
            <div key={doc} style={{ fontSize: 12, color: '#595959', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#703BF7', fontWeight: 700 }}>{i + 1}.</span> {doc}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
