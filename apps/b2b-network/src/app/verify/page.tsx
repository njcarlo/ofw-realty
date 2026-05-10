'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Sidebar } from '@/components/Sidebar'
import type { B2BProfile } from '@/lib/types'

const STEPS = [
  { n: 1, label: 'Upload PRC ID', icon: '🪪' },
  { n: 2, label: 'Enter License Details', icon: '📋' },
  { n: 3, label: 'Submit for Review', icon: '✅' },
]

export default function VerifyPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<B2BProfile | null>(null)
  const [step, setStep] = useState(1)
  const [prcIdFile, setPrcIdFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [prcIdPreview, setPrcIdPreview] = useState<string | null>(null)
  const [form, setForm] = useState({
    prc_license_number: '',
    prc_license_type: 'broker' as 'broker' | 'salesperson' | 'appraiser',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [existingVerification, setExistingVerification] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session
      if (!session) { router.replace('/login'); return }
      const { data: prof } = await supabase.from('b2b_profiles').select('*').eq('user_id', session.user.id).maybeSingle()
      setProfile(prof)
      if (prof) {
        const { data: verif } = await supabase.from('b2b_prc_verifications').select('*').eq('profile_id', prof.id).order('submitted_at', { ascending: false }).limit(1).maybeSingle()
        setExistingVerification(verif)
        if (verif?.status === 'approved') setSubmitted(true)
      }
    })
  }, [router])

  function handlePrcIdChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPrcIdFile(file)
    setPrcIdPreview(URL.createObjectURL(file))
  }

  async function handleSubmit() {
    if (!profile || !prcIdFile) return
    setSubmitting(true)
    try {
      // Upload PRC ID to Supabase Storage
      const ext = prcIdFile.name.split('.').pop()
      const path = `prc-ids/${profile.id}/${Date.now()}.${ext}`
      const { data: uploadData, error: uploadErr } = await supabase.storage.from('b2b-documents').upload(path, prcIdFile, { upsert: true })
      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage.from('b2b-documents').getPublicUrl(path)

      // Upload selfie if provided
      let selfieUrl: string | undefined
      if (selfieFile) {
        const selfieExt = selfieFile.name.split('.').pop()
        const selfiePath = `selfies/${profile.id}/${Date.now()}.${selfieExt}`
        const { data: selfieData } = await supabase.storage.from('b2b-documents').upload(selfiePath, selfieFile, { upsert: true })
        if (selfieData) {
          const { data: { publicUrl: sUrl } } = supabase.storage.from('b2b-documents').getPublicUrl(selfiePath)
          selfieUrl = sUrl
        }
      }

      // Insert verification request
      await supabase.from('b2b_prc_verifications').insert({
        profile_id: profile.id,
        prc_license_number: form.prc_license_number,
        prc_license_type: form.prc_license_type,
        prc_id_url: publicUrl,
        selfie_url: selfieUrl,
        status: 'pending',
      })

      // Update profile with PRC info
      await supabase.from('b2b_profiles').update({
        prc_license_number: form.prc_license_number,
        prc_license_type: form.prc_license_type,
        prc_id_url: publicUrl,
      }).eq('id', profile.id)

      setSubmitted(true)
    } catch (err: any) {
      alert('Upload failed: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle: React.CSSProperties = { width: '100%', background: '#141414', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#fff', outline: 'none', boxSizing: 'border-box' }
  const labelStyle: React.CSSProperties = { fontSize: 12, color: '#595959', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: 'Inter, sans-serif', color: '#fff' }}>
      <Sidebar profile={profile ?? undefined} />
      <main style={{ flex: 1, overflowY: 'auto', padding: '40px 32px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0 }}>🔐 PRC ID Verification</h1>
            <p style={{ fontSize: 14, color: '#595959', marginTop: 8, lineHeight: 1.6 }}>
              Get your PRC Verified badge to build trust with the broker network. Upload your PRC ID and we'll verify your license within 1-2 business days.
            </p>
          </div>

          {/* Already verified */}
          {profile?.prc_verified && (
            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14, padding: 28, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 8 }}>You're PRC Verified!</div>
              <p style={{ fontSize: 14, color: '#595959' }}>Your PRC license has been verified. Your profile shows the ✓ PRC Verified badge.</p>
              <div style={{ marginTop: 16, background: '#141414', borderRadius: 10, padding: '12px 16px', display: 'inline-block' }}>
                <div style={{ fontSize: 12, color: '#595959' }}>License Number</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#10B981' }}>{profile.prc_license_number}</div>
              </div>
            </div>
          )}

          {/* Pending review */}
          {!profile?.prc_verified && existingVerification?.status === 'pending' && (
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, padding: 28, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Verification Pending</div>
              <p style={{ fontSize: 14, color: '#595959' }}>Your PRC ID has been submitted and is under review. We'll notify you within 1-2 business days.</p>
            </div>
          )}

          {/* Rejected — allow resubmission */}
          {!profile?.prc_verified && existingVerification?.status === 'rejected' && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#EF4444', marginBottom: 4 }}>❌ Previous submission rejected</div>
              <div style={{ fontSize: 13, color: '#595959' }}>{existingVerification.rejection_reason ?? 'Please resubmit with a clearer photo of your PRC ID.'}</div>
            </div>
          )}

          {/* Verification form */}
          {!profile?.prc_verified && existingVerification?.status !== 'pending' && (
            <>
              {/* Steps */}
              <div style={{ display: 'flex', gap: 0, marginBottom: 32 }}>
                {STEPS.map((s, i) => (
                  <div key={s.n} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: step >= s.n ? '#703BF7' : '#141414', border: `2px solid ${step >= s.n ? '#703BF7' : '#262626'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 6 }}>
                        {step > s.n ? '✓' : s.icon}
                      </div>
                      <div style={{ fontSize: 11, color: step >= s.n ? '#fff' : '#595959', fontWeight: step === s.n ? 600 : 400, textAlign: 'center' }}>{s.label}</div>
                    </div>
                    {i < STEPS.length - 1 && <div style={{ height: 2, flex: 1, background: step > s.n ? '#703BF7' : '#1A1A1A', marginBottom: 20 }} />}
                  </div>
                ))}
              </div>

              {/* Step 1: Upload PRC ID */}
              {step === 1 && (
                <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, padding: 28 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Upload your PRC ID</div>
                  <p style={{ fontSize: 13, color: '#595959', marginBottom: 24, lineHeight: 1.6 }}>
                    Take a clear photo of your PRC Professional Identification Card. Make sure all text is readable and the card is not expired.
                  </p>

                  <label style={{ display: 'block', marginBottom: 20 }}>
                    <div style={{ border: `2px dashed ${prcIdFile ? '#703BF7' : '#262626'}`, borderRadius: 12, padding: 32, textAlign: 'center', cursor: 'pointer', background: prcIdFile ? 'rgba(112,59,247,0.05)' : 'transparent', transition: 'all 0.15s' }}>
                      {prcIdPreview ? (
                        <img src={prcIdPreview} alt="PRC ID preview" style={{ maxHeight: 200, borderRadius: 8, objectFit: 'contain' }} />
                      ) : (
                        <>
                          <div style={{ fontSize: 40, marginBottom: 12 }}>🪪</div>
                          <div style={{ fontSize: 14, color: '#fff', fontWeight: 600, marginBottom: 4 }}>Click to upload PRC ID</div>
                          <div style={{ fontSize: 12, color: '#595959' }}>JPG, PNG, or PDF · Max 5MB</div>
                        </>
                      )}
                    </div>
                    <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handlePrcIdChange} />
                  </label>

                  <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>Selfie with PRC ID (optional but recommended)</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#141414', border: '1px dashed #1A1A1A', borderRadius: 8, padding: '12px 16px', cursor: 'pointer' }}>
                      <span style={{ fontSize: 20 }}>🤳</span>
                      <div>
                        <div style={{ fontSize: 13, color: selfieFile ? '#10B981' : '#999' }}>{selfieFile ? `${selfieFile.name} ✓` : 'Upload selfie holding your PRC ID'}</div>
                        <div style={{ fontSize: 11, color: '#595959' }}>Helps speed up verification</div>
                      </div>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setSelfieFile(e.target.files?.[0] ?? null)} />
                    </label>
                  </div>

                  <button onClick={() => setStep(2)} disabled={!prcIdFile}
                    style={{ width: '100%', background: prcIdFile ? '#703BF7' : '#1A1A1A', color: prcIdFile ? '#fff' : '#595959', border: 'none', borderRadius: 8, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: prcIdFile ? 'pointer' : 'not-allowed', boxShadow: prcIdFile ? '0 0 20px rgba(112,59,247,0.3)' : 'none' }}>
                    Continue →
                  </button>
                </div>
              )}

              {/* Step 2: License details */}
              {step === 2 && (
                <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, padding: 28 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Enter License Details</div>
                  <p style={{ fontSize: 13, color: '#595959', marginBottom: 24 }}>Enter the details exactly as they appear on your PRC ID.</p>

                  <div style={{ marginBottom: 18 }}>
                    <label style={labelStyle}>PRC License Number *</label>
                    <input type="text" value={form.prc_license_number} onChange={e => setForm(f => ({ ...f, prc_license_number: e.target.value }))}
                      placeholder="e.g. 0012345" style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = 'rgba(112,59,247,0.4)')}
                      onBlur={e => (e.target.style.borderColor = '#1A1A1A')}
                    />
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label style={labelStyle}>License Type *</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {(['broker', 'salesperson', 'appraiser'] as const).map(t => (
                        <button key={t} onClick={() => setForm(f => ({ ...f, prc_license_type: t }))}
                          style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: `1px solid ${form.prc_license_type === t ? 'rgba(112,59,247,0.5)' : '#1A1A1A'}`, background: form.prc_license_type === t ? 'rgba(112,59,247,0.1)' : '#141414', color: form.prc_license_type === t ? '#703BF7' : '#595959', fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>
                          {t === 'broker' ? '🏢 Broker' : t === 'salesperson' ? '👤 Salesperson' : '📊 Appraiser'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8, padding: '12px 16px', marginBottom: 24 }}>
                    <div style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600, marginBottom: 4 }}>⚠️ Privacy Notice</div>
                    <div style={{ fontSize: 12, color: '#595959', lineHeight: 1.6 }}>Your PRC ID and license details are used only for verification. They are stored securely and never shared publicly. Only your verified status and license type are shown on your profile.</div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setStep(1)} style={{ flex: 1, background: 'transparent', color: '#595959', border: '1px solid #1A1A1A', borderRadius: 8, padding: '12px 0', fontSize: 14, cursor: 'pointer' }}>← Back</button>
                    <button onClick={() => setStep(3)} disabled={!form.prc_license_number}
                      style={{ flex: 2, background: form.prc_license_number ? '#703BF7' : '#1A1A1A', color: form.prc_license_number ? '#fff' : '#595959', border: 'none', borderRadius: 8, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: form.prc_license_number ? 'pointer' : 'not-allowed', boxShadow: form.prc_license_number ? '0 0 20px rgba(112,59,247,0.3)' : 'none' }}>
                      Review & Submit →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Review & submit */}
              {step === 3 && (
                <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, padding: 28 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Review & Submit</div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                    <div style={{ background: '#141414', borderRadius: 10, padding: '14px 16px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: '#595959' }}>PRC ID Photo</span>
                      <span style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>✓ Uploaded</span>
                    </div>
                    <div style={{ background: '#141414', borderRadius: 10, padding: '14px 16px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: '#595959' }}>License Number</span>
                      <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{form.prc_license_number}</span>
                    </div>
                    <div style={{ background: '#141414', borderRadius: 10, padding: '14px 16px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: '#595959' }}>License Type</span>
                      <span style={{ fontSize: 13, color: '#fff', fontWeight: 600, textTransform: 'capitalize' }}>{form.prc_license_type}</span>
                    </div>
                    {selfieFile && (
                      <div style={{ background: '#141414', borderRadius: 10, padding: '14px 16px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, color: '#595959' }}>Selfie with ID</span>
                        <span style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>✓ Included</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setStep(2)} style={{ flex: 1, background: 'transparent', color: '#595959', border: '1px solid #1A1A1A', borderRadius: 8, padding: '12px 0', fontSize: 14, cursor: 'pointer' }}>← Back</button>
                    <button onClick={handleSubmit} disabled={submitting}
                      style={{ flex: 2, background: submitting ? '#333' : '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: submitting ? 'none' : '0 0 20px rgba(112,59,247,0.3)' }}>
                      {submitting ? 'Submitting…' : '🔐 Submit for Verification'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
