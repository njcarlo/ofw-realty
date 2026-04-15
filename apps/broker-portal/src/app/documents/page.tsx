import { BrokerSidebar } from '@/components/BrokerSidebar'

const DOCS = [
  { name: 'DTI Business Registration', status: 'approved', expiry: 'Dec 31, 2026', docNum: 1 },
  { name: 'SEC Certificate of Incorporation', status: 'approved', expiry: 'Dec 31, 2026', docNum: 2 },
  { name: 'PRC Broker License (Principal)', status: 'approved', expiry: 'Jun 30, 2026', docNum: 3 },
  { name: 'HLURB/DHSUD Accreditation', status: 'approved', expiry: 'Mar 31, 2027', docNum: 4 },
  { name: 'BIR Certificate of Registration', status: 'approved', expiry: 'Dec 31, 2026', docNum: 5 },
  { name: 'Mayor\'s Permit / Business Permit', status: 'pending', expiry: null, docNum: 6 },
  { name: 'Surety Bond', status: 'submitted', expiry: null, docNum: 7 },
  { name: 'Professional Tax Receipt (PTR)', status: 'approved', expiry: 'Dec 31, 2026', docNum: 8 },
  { name: 'Company Profile & Org Chart', status: 'approved', expiry: null, docNum: 9 },
]

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  approved: { bg: 'rgba(16,185,129,0.15)', color: '#10B981', label: '✓ Approved' },
  submitted: { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B', label: '⏳ Under Review' },
  pending: { bg: 'rgba(239,68,68,0.15)', color: '#EF4444', label: '⚠️ Action Needed' },
}

export default function DocumentsPage() {
  const approved = DOCS.filter(d => d.status === 'approved').length
  const allApproved = approved === DOCS.length

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <BrokerSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Verification Documents</h1>
          <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>9 required documents for Verified Brokerage Badge</p>
        </div>

        {/* Progress */}
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Verification Progress</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: allApproved ? '#10B981' : '#703BF7' }}>{approved}/{DOCS.length} approved</div>
          </div>
          <div style={{ height: 8, background: '#141414', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(approved / DOCS.length) * 100}%`, background: allApproved ? '#10B981' : '#703BF7', borderRadius: 99, transition: 'width 0.3s' }} />
          </div>
          {allApproved && (
            <div style={{ marginTop: 12, fontSize: 13, color: '#10B981', fontWeight: 600 }}>🎉 All documents approved — Verified Brokerage Badge active!</div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {DOCS.map(doc => (
            <div key={doc.docNum} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: STATUS_STYLE[doc.status].bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: STATUS_STYLE[doc.status].color, flexShrink: 0 }}>
                {doc.docNum}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{doc.name}</div>
                {doc.expiry && <div style={{ fontSize: 12, color: '#595959', marginTop: 2 }}>Expires: {doc.expiry}</div>}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: STATUS_STYLE[doc.status].bg, color: STATUS_STYLE[doc.status].color }}>
                {STATUS_STYLE[doc.status].label}
              </span>
              {doc.status !== 'approved' && (
                <button style={{ background: '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Upload
                </button>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
