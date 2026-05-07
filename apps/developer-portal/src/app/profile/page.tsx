'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DeveloperSidebar } from '@/components/DeveloperSidebar'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export default function ProfilePage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState({
    company_name: '',
    verification_status: 'pending',
    verified_badge: false,
    description: '',
    office_address: '',
    website_url: '',
    social_links: { facebook: '', instagram: '', linkedin: '' },
    logo_url: '',
    cover_url: '',
  })

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const t = data.session?.access_token
      if (!t) { router.replace('/onboarding'); return }
      setToken(t)
      const res = await fetch(`${API}/api/developers/me`, {
        headers: { Authorization: `Bearer ${t}` },
      })
      if (res.ok) {
        const d = await res.json()
        setProfile(p => ({ ...p, ...d }))
      }
    })
  }, [router])

  async function handleSave() {
    if (!token) return
    setSaving(true)
    try {
      await fetch(`${API}/api/developers/me`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: profile.description,
          office_address: profile.office_address,
          website_url: profile.website_url,
          social_links: profile.social_links,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmitForReview() {
    if (!token) return
    setSubmitting(true)
    try {
      await fetch(`${API}/api/developers/me/submit-review`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      setProfile(p => ({ ...p, verification_status: 'pending' }))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpload(field: 'logo_url' | 'cover_url', file: File) {
    if (!token) return
    const ext = file.name.split('.').pop()
    const path = `${field === 'logo_url' ? 'logos' : 'covers'}/${Date.now()}.${ext}`
    const { data, error } = await supabase.storage.from('developer-media').upload(path, file, { upsert: true })
    if (error || !data) return
    const { data: { publicUrl } } = supabase.storage.from('developer-media').getPublicUrl(data.path)
    setProfile(p => ({ ...p, [field]: publicUrl }))
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#141414', border: '1px solid #1A1A1A',
    borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#fff',
    outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: '#595959', display: 'block', marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: '0.05em',
  }

  const statusColor = profile.verification_status === 'verified' ? '#10B981'
    : profile.verification_status === 'suspended' ? '#EF4444'
    : profile.verification_status === 'rejected' ? '#EF4444'
    : '#F59E0B'

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <DeveloperSidebar verified={profile.verified_badge} companyName={profile.company_name || 'My Company'} />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Company Profile</h1>
            <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>Your public developer page on LUPAPH</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {saved && <span style={{ fontSize: 13, color: '#10B981' }}>✓ Saved</span>}
            {profile.verification_status === 'pending' && (
              <button
                onClick={handleSubmitForReview} disabled={submitting}
                style={{ background: 'transparent', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
              >
                {submitting ? 'Submitting…' : '📋 Submit for Review'}
              </button>
            )}
            <button
              onClick={handleSave} disabled={saving}
              style={{ background: saving ? '#333' : '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 0 20px rgba(112,59,247,0.3)' }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Verification status banner */}
        <div style={{ background: '#0D0D0D', border: `1px solid ${statusColor}30`, borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: `${statusColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
            {profile.verification_status === 'verified' ? '✅' : profile.verification_status === 'suspended' ? '🚫' : profile.verification_status === 'rejected' ? '❌' : '⏳'}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', textTransform: 'capitalize' }}>
              {profile.verification_status === 'verified' ? 'Verified Developer' : `Account ${profile.verification_status}`}
            </div>
            <div style={{ fontSize: 13, color: statusColor }}>
              {profile.verification_status === 'verified' && '✓ Verified Developer Badge is active on your profile'}
              {profile.verification_status === 'pending' && 'Your account is pending Admin review. Submit for review to proceed.'}
              {profile.verification_status === 'rejected' && 'Your account was rejected. Please contact support.'}
              {profile.verification_status === 'suspended' && 'Your account is suspended. All projects are hidden from public view.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Media uploads */}
            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Company Media</div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Company Logo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 10, background: '#141414', border: '1px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {profile.logo_url ? <img src={profile.logo_url} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 24 }}>🏗️</span>}
                  </div>
                  <label style={{ background: '#141414', border: '1px solid #1A1A1A', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#999', cursor: 'pointer' }}>
                    Upload Logo
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleUpload('logo_url', e.target.files[0])} />
                  </label>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Cover Image</label>
                <div style={{ width: '100%', height: 120, borderRadius: 10, background: '#141414', border: '1px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 10 }}>
                  {profile.cover_url ? <img src={profile.cover_url} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 32 }}>🌆</span>}
                </div>
                <label style={{ background: '#141414', border: '1px solid #1A1A1A', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#999', cursor: 'pointer', display: 'inline-block' }}>
                  Upload Cover
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleUpload('cover_url', e.target.files[0])} />
                </label>
              </div>
            </div>

            {/* Basic info */}
            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Basic Information</div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Company Description</label>
                <textarea
                  rows={4} maxLength={1000} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                  value={profile.description}
                  onChange={e => setProfile(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describe your company (max 1000 characters)"
                />
                <div style={{ fontSize: 11, color: '#595959', marginTop: 4, textAlign: 'right' }}>{profile.description.length}/1000</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Office Address</label>
                <input type="text" style={inputStyle} value={profile.office_address} onChange={e => setProfile(p => ({ ...p, office_address: e.target.value }))} placeholder="Full office address" />
              </div>
              <div>
                <label style={labelStyle}>Website URL</label>
                <input type="url" style={inputStyle} value={profile.website_url} onChange={e => setProfile(p => ({ ...p, website_url: e.target.value }))} placeholder="https://yourcompany.com" />
              </div>
            </div>
          </div>

          {/* Social links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Social Media Links</div>
              {[
                { key: 'facebook', label: 'Facebook Page', icon: '📘', placeholder: 'https://facebook.com/yourpage' },
                { key: 'instagram', label: 'Instagram', icon: '📸', placeholder: 'https://instagram.com/yourhandle' },
                { key: 'linkedin', label: 'LinkedIn', icon: '💼', placeholder: 'https://linkedin.com/company/yourcompany' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>{f.icon} {f.label}</label>
                  <input
                    type="url" placeholder={f.placeholder} style={inputStyle}
                    value={(profile.social_links as any)[f.key] ?? ''}
                    onChange={e => setProfile(p => ({ ...p, social_links: { ...p.social_links, [f.key]: e.target.value } }))}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
