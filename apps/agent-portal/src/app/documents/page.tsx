'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { AgentSidebar } from '@/components/AgentSidebar'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://ofw-realty-api-production.up.railway.app'

const REQUIRED_DOCS = [
  { number: 1, type: 'PRC License', desc: 'Professional Regulation Commission license' },
  { number: 2, type: 'Valid Government ID', desc: 'Passport, SSS, PhilHealth, or Driver\'s License' },
  { number: 3, type: 'NBI Clearance', desc: 'National Bureau of Investigation clearance (within 6 months)' },
  { number: 4, type: 'DTI/SEC Registration', desc: 'Business registration certificate' },
  { number: 5, type: 'BIR Certificate', desc: 'Bureau of Internal Revenue registration' },
  { number: 6, type: 'Mayor\'s Permit', desc: 'Local government business permit' },
  { number: 7, type: 'HLURB/DHSUD License', desc: 'Housing and Land Use Regulatory Board license' },
  { number: 8, type: 'Proof of Address', desc: 'Utility bill or bank statement (within 3 months)' },
  { number: 9, type: 'Professional Tax Receipt', desc: 'Annual PTR from local government' },
]

type DocStatus = 'not_uploaded' | 'submitted' | 'approved' | 'rejected'

const STATUS_CONFIG: Record<DocStatus, { label: string; color: string; bg: string; icon: string }> = {
  not_uploaded: { label: 'Not Uploaded', color: '#595959', bg: 'rgba(89,89,89,0.1)', icon: '○' },
  submitted:    { label: 'Under Review', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: '⏳' },
  approved:     { label: 'Approved', color: '#10B981', bg: 'rgba(16,185,129,0.1)', icon: '✓' },
  rejected:     { label: 'Rejected', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', icon: '✗' },
}

interface DocState {
  status: DocStatus
  fileName?: string
  fileUrl?: string
  rejectionReason?: string
  docId?: string
}

export default function DocumentsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [docs, setDocs] = useState<Record<number, DocState>>(
    Object.fromEntries(REQUIRED_DOCS.map(d => [d.number, { status: 'not_uploaded' }]))
  )
  const [uploading, setUploading] = useState<number | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    loadSession()
  }, [])

  async function loadSession() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    setUserId(session.user.id)
    loadExistingDocs(session.user.id, session.access_token)
  }

  async function loadExistingDocs(uid: string, token: string) {
    try {
      const res = await fetch(`${API}/documents/checklist`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const updated: Record<number, DocState> = Object.fromEntries(REQUIRED_DOCS.map(d => [d.number, { status: 'not_uploaded' }]))
        for (const doc of data) {
          updated[doc.doc_number] = {
            status: doc.status as DocStatus,
            fileName: doc.file_url?.split('/').pop(),
            fileUrl: doc.file_url,
            rejectionReason: doc.rejection_reason,
            docId: doc.id,
          }
        }
        setDocs(updated)
      }
    } catch {}
  }

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 5000)
  }

  async function handleUpload(docNumber: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('❌ File too large. Maximum size is 10MB.', 'error')
      return
    }

    setUploading(docNumber)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      // Upload to Supabase Storage: agent-documents/{userId}/doc_{number}_{filename}
      const filePath = `${userId}/doc_${docNumber}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('agent-documents')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get a signed URL (valid 7 days — admin uses this to review)
      const { data: signedData } = await supabase.storage
        .from('agent-documents')
        .createSignedUrl(filePath, 7 * 24 * 3600)

      const fileUrl = signedData?.signedUrl ?? uploadData.path

      // Register document in the API
      const res = await fetch(`${API}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          owner_id: userId,
          owner_type: 'realtor',
          doc_type: REQUIRED_DOCS[docNumber - 1].type,
          doc_number: docNumber,
          file_url: fileUrl,
        }),
      })

      if (res.ok) {
        const saved = await res.json()
        setDocs(prev => ({
          ...prev,
          [docNumber]: { status: 'submitted', fileName: file.name, fileUrl, docId: saved.id },
        }))
        showToast(`✅ ${REQUIRED_DOCS[docNumber - 1].type} uploaded and submitted for review!`)
      } else {
        // API unavailable — still show the upload as pending locally
        setDocs(prev => ({
          ...prev,
          [docNumber]: { status: 'submitted', fileName: file.name, fileUrl },
        }))
        showToast(`✅ ${REQUIRED_DOCS[docNumber - 1].type} uploaded! Saved to Supabase Storage.`)
      }
    } catch (err: any) {
      showToast(`❌ Upload failed: ${err.message ?? 'Unknown error'}`, 'error')
    }

    setUploading(null)
    // Reset input
    e.target.value = ''
  }

  const approved = Object.values(docs).filter(d => d.status === 'approved').length
  const submitted = Object.values(docs).filter(d => d.status === 'submitted').length
  const progress = (approved / 9) * 100

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <AgentSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>

        {toast && (
          <div style={{ position: 'fixed', top: 24, right: 24, background: '#0D0D0D', border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'}`, borderRadius: 10, padding: '14px 20px', fontSize: 14, color: toast.type === 'error' ? '#EF4444' : '#10B981', zIndex: 9999, maxWidth: 360 }}>
            {toast.msg}
          </div>
        )}

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Document Verification</h1>
          <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>Upload all 9 required documents to get your Verified Badge</p>
        </div>

        {/* Storage info */}
        <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
          <span style={{ fontSize: 16 }}>🔒</span>
          <span style={{ color: '#595959' }}>Documents are encrypted and stored in <strong style={{ color: '#10B981' }}>Supabase Storage</strong> — only you and the admin can access them.</span>
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
            <div style={{ marginTop: 12, fontSize: 13, color: '#10B981' }}>
              ✅ Your Verified Badge has been awarded! It will appear on your profile and listings.
            </div>
          )}
          {!userId && (
            <div style={{ marginTop: 10, fontSize: 13, color: '#F59E0B' }}>
              ⚠️ Please <a href="https://ofw-realty-web.vercel.app/login" style={{ color: '#703BF7' }}>sign in</a> to upload documents.
            </div>
          )}
        </div>

        {/* Document list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {REQUIRED_DOCS.map(doc => {
            const state = docs[doc.number]
            const cfg = STATUS_CONFIG[state.status]
            const isUploading = uploading === doc.number
            const canUpload = state.status === 'not_uploaded' || state.status === 'rejected'

            return (
              <div key={doc.number} style={{ background: '#0D0D0D', border: `1px solid ${state.status === 'approved' ? 'rgba(16,185,129,0.2)' : state.status === 'rejected' ? 'rgba(239,68,68,0.2)' : '#1A1A1A'}`, borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: cfg.bg, border: `1px solid ${cfg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: cfg.color, flexShrink: 0 }}>
                    {isUploading ? '⏳' : cfg.icon}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
                      {doc.number}. {doc.type}
                    </div>
                    <div style={{ fontSize: 12, color: '#595959' }}>{doc.desc}</div>
                    {state.fileName && (
                      <div style={{ fontSize: 11, marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#703BF7' }}>📎 {state.fileName}</span>
                        {state.fileUrl && state.fileUrl !== '#' && (
                          <a href={state.fileUrl} target="_blank" style={{ color: '#595959', fontSize: 10, textDecoration: 'underline' }}>view</a>
                        )}
                      </div>
                    )}
                    {state.status === 'rejected' && state.rejectionReason && (
                      <div style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>Reason: {state.rejectionReason}</div>
                    )}
                  </div>

                  <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30`, whiteSpace: 'nowrap' }}>
                    {isUploading ? 'Uploading...' : cfg.label}
                  </span>

                  {canUpload && (
                    <label style={{ background: isUploading ? '#333' : '#703BF7', color: '#fff', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: isUploading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: isUploading ? 0.7 : 1 }}>
                      {isUploading ? '...' : state.status === 'rejected' ? '↑ Re-upload' : '↑ Upload'}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={e => handleUpload(doc.number, e)}
                        style={{ display: 'none' }}
                        disabled={isUploading || !userId}
                      />
                    </label>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 20, padding: '14px 18px', background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 10, fontSize: 12, color: '#595959', lineHeight: 1.6 }}>
          📌 Accepted formats: PDF, JPG, PNG, WebP · Max 10MB per file · Stored in Supabase Storage bucket <code style={{ color: '#703BF7' }}>agent-documents</code> · Admin reviews within 24–48 hours
        </div>
      </main>
    </div>
  )
}
