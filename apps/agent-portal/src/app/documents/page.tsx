'use client'
import { useState } from 'react'
import { AgentSidebar } from '@/components/AgentSidebar'

const REQUIRED_DOCS = [
  { number: 1, type: 'PRC License', desc: 'Professional Regulation Commission license', required: true },
  { number: 2, type: 'Valid Government ID', desc: 'Passport, SSS, PhilHealth, or Driver\'s License', required: true },
  { number: 3, type: 'NBI Clearance', desc: 'National Bureau of Investigation clearance (within 6 months)', required: true },
  { number: 4, type: 'DTI/SEC Registration', desc: 'Business registration certificate', required: true },
  { number: 5, type: 'BIR Certificate', desc: 'Bureau of Internal Revenue registration', required: true },
  { number: 6, type: 'Mayor\'s Permit', desc: 'Local government business permit', required: true },
  { number: 7, type: 'HLURB/DHSUD License', desc: 'Housing and Land Use Regulatory Board license', required: true },
  { number: 8, type: 'Proof of Address', desc: 'Utility bill or bank statement (within 3 months)', required: true },
  { number: 9, type: 'Professional Tax Receipt', desc: 'Annual PTR from local government', required: true },
]

type DocStatus = 'not_uploaded' | 'uploaded' | 'submitted' | 'approved' | 'rejected'

const STATUS_CONFIG: Record<DocStatus, { label: string; color: string; bg: string; icon: string }> = {
  not_uploaded: { label: 'Not Uploaded', color: '#595959', bg: 'rgba(89,89,89,0.1)', icon: '○' },
  uploaded:     { label: 'Uploaded', color: '#06B6D4', bg: 'rgba(6,182,212,0.1)', icon: '↑' },
  submitted:    { label: 'Under Review', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: '⏳' },
  approved:     { label: 'Approved', color: '#10B981', bg: 'rgba(16,185,129,0.1)', icon: '✓' },
  rejected:     { label: 'Rejected', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', icon: '✗' },
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Record<number, { status: DocStatus; fileName?: string; rejectionReason?: string }>>(
    Object.fromEntries(REQUIRED_DOCS.map(d => [d.number, { status: 'not_uploaded' }]))
  )
  const [uploading, setUploading] = useState<number | null>(null)
  const [toast, setToast] = useState('')

  const approved = Object.values(docs).filter(d => d.status === 'approved').length
  const submitted = Object.values(docs).filter(d => d.status === 'submitted').length
  const progress = (approved / 9) * 100

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  async function handleUpload(docNumber: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(docNumber)
    // Simulate upload
    await new Promise(r => setTimeout(r, 1500))
    setDocs(prev => ({ ...prev, [docNumber]: { status: 'submitted', fileName: file.name } }))
    setUploading(null)
    showToast(`✅ ${REQUIRED_DOCS[docNumber - 1].type} submitted for review!`)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <AgentSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>

        {toast && (
          <div style={{ position: 'fixed', top: 24, right: 24, background: '#0D0D0D', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 10, padding: '14px 20px', fontSize: 14, color: '#10B981', zIndex: 9999 }}>
            {toast}
          </div>
        )}

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Document Verification</h1>
          <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>Upload all 9 required documents to get your Verified Badge</p>
        </div>

        {/* Progress */}
        <div style={{ background: '#0D0D0D', border: `1px solid ${approved === 9 ? 'rgba(16,185,129,0.3)' : '#1A1A1A'}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
              {approved === 9 ? '🎉 Fully Verified!' : `${approved}/9 Documents Approved`}
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#595959' }}>
              <span style={{ color: '#10B981' }}>✓ {approved} approved</span>
              <span style={{ color: '#F59E0B' }}>⏳ {submitted} under review</span>
              <span>○ {9 - approved - submitted} remaining</span>
            </div>
          </div>
          <div style={{ background: '#1A1A1A', borderRadius: 99, height: 8 }}>
            <div style={{ width: `${progress}%`, height: '100%', background: approved === 9 ? '#10B981' : '#703BF7', borderRadius: 99, transition: 'width 0.5s' }} />
          </div>
          {approved === 9 && (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#10B981' }}>
              ✅ Your Verified Badge has been awarded! It will appear on your profile and listings.
            </div>
          )}
        </div>

        {/* What happens after */}
        <div style={{ background: 'rgba(112,59,247,0.06)', border: '1px solid rgba(112,59,247,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#703BF7', marginBottom: 6 }}>ℹ️ How verification works</div>
          <div style={{ fontSize: 13, color: '#595959', lineHeight: 1.7 }}>
            Upload all 9 documents → Admin reviews within 24–48 hours → Each approved document is hashed on the blockchain → When all 9 are approved, you receive a <strong style={{ color: '#fff' }}>Verified Badge ✓</strong> and a scannable QR code that buyers can use to verify your credentials.
          </div>
        </div>

        {/* Document list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {REQUIRED_DOCS.map(doc => {
            const state = docs[doc.number]
            const cfg = STATUS_CONFIG[state.status]
            const isUploading = uploading === doc.number

            return (
              <div key={doc.number} style={{ background: '#0D0D0D', border: `1px solid ${state.status === 'approved' ? 'rgba(16,185,129,0.2)' : state.status === 'rejected' ? 'rgba(239,68,68,0.2)' : '#1A1A1A'}`, borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {/* Number */}
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: cfg.bg, border: `1px solid ${cfg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: cfg.color, flexShrink: 0 }}>
                    {cfg.icon}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
                      {doc.number}. {doc.type}
                    </div>
                    <div style={{ fontSize: 12, color: '#595959' }}>{doc.desc}</div>
                    {state.fileName && (
                      <div style={{ fontSize: 11, color: '#703BF7', marginTop: 3 }}>📎 {state.fileName}</div>
                    )}
                    {state.status === 'rejected' && state.rejectionReason && (
                      <div style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>Reason: {state.rejectionReason}</div>
                    )}
                  </div>

                  {/* Status badge */}
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30`, whiteSpace: 'nowrap' }}>
                    {cfg.label}
                  </span>

                  {/* Upload button */}
                  {(state.status === 'not_uploaded' || state.status === 'rejected') && (
                    <label style={{ background: '#703BF7', color: '#fff', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: isUploading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: isUploading ? 0.7 : 1 }}>
                      {isUploading ? 'Uploading...' : state.status === 'rejected' ? '↑ Re-upload' : '↑ Upload'}
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => handleUpload(doc.number, e)} style={{ display: 'none' }} disabled={isUploading} />
                    </label>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 20, padding: '14px 18px', background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 10, fontSize: 12, color: '#595959', lineHeight: 1.6 }}>
          📌 Accepted formats: PDF, JPG, PNG · Max file size: 10MB per document · Documents are encrypted and stored securely · Your data is never shared without your consent.
        </div>
      </main>
    </div>
  )
}
