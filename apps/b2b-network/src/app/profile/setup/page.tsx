'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const SPECIALIZATIONS = ['Residential', 'Commercial', 'Industrial', 'Farm Lots', 'Condominiums', 'OFW Clients', 'Foreclosures', 'Pre-Selling', 'Rentals', 'Property Management']
const LANGUAGES = ['Filipino', 'English', 'Cebuano', 'Ilocano', 'Hiligaynon', 'Waray', 'Arabic', 'Japanese', 'Korean']

export default function ProfileSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [form, setForm] = useState({
    display_name: '', headline: '', bio: '', location: '',
    years_experience: '', website_url: '',
    specializations: [] as string[], languages: [] as string[],
    social_links: { facebook: '', instagram: '', linkedin: '' },
  })

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session
      if (!session) { router.replace('/login'); return }

      // Check if profile already exists
      const { data: prof } = await supabase.from('b2b_profiles').select('*').eq('user_id', session.user.id).maybeSingle()
      if (prof) {
        setForm({
          display_name: prof.display_name ?? '',
          headline: prof.headline ?? '',
          bio: prof.bio ?? '',
          location: prof.location ?? '',
          years_experience: prof.years_experience?.toString() ?? '',
          website_url: prof.website_url ?? '',
          specializations: prof.specializations ?? [],
          languages: prof.languages ?? [],
          social_links: { facebook: prof.social_links?.facebook ?? '', instagram: prof.social_links?.instagram ?? '', linkedin: prof.social_links?.linkedin ?? '' },
        })
        if (prof.avatar_url) setAvatarPreview(prof.avatar_url)
      } else {
        // Pre-fill from auth user
        const meta = session.user.user_metadata
        setForm(f => ({ ...f, display_name: meta?.full_name ?? '' }))
      }
      setLoading(false)
    })
  }, [router])

  function toggleSpec(s: string) {
    setForm(f => ({ ...f, specializations: f.specializations.includes(s) ? f.specializations.filter(x => x !== s) : [...f.specializations, s] }))
  }
  function toggleLang(l: string) {
    setForm(f => ({ ...f, languages: f.languages.includes(l) ? f.languages.filter(x => x !== l) : [...f.languages, l] }))
  }

  async function handleSave() {
    if (!form.display_name.trim()) return
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      let avatarUrl: string | undefined
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        const path = `avatars/${session.user.id}.${ext}`
        await supabase.storage.from('b2b-documents').upload(path, avatarFile, { upsert: true })
        const { data: { publicUrl } } = supabase.storage.from('b2b-documents').getPublicUrl(path)
        avatarUrl = publicUrl
      }

      const payload = {
        user_id: session.user.id,
        display_name: form.display_name.trim(),
        headline: form.headline.trim() || null,
        bio: form.bio.trim() || null,
        location: form.location.trim() || null,
        years_experience: form.years_experience ? parseInt(form.years_experience) : null,
        website_url: form.website_url.trim() || null,
        specializations: form.specializations,
        languages: form.languages,
        social_links: form.social_links,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        updated_at: new Date().toISOString(),
      }

      await supabase.from('b2b_profiles').upsert(payload, { onConflict: 'user_id' })
      router.push('/feed')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = { width: '100%', background: '#141414', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#fff', outline: 'none', boxSizing: 'border-box' }
  const labelStyle: React.CSSProperties = { fontSize: 12, color: '#595959', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }

  if (loading) return <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#595959', fontFamily: 'Inter, sans-serif' }}>Loading…</div>

  return (
    <div style={{ minHeight: '100vh', background: '#000', fontFamily: 'Inter, sans-serif', color: '#fff', padding: '40px 24px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>LUPA <span style={{ color: '#703BF7' }}>PH</span> <span style={{ color: '#595959', fontWeight: 400 }}>B2B Network</span></div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '12px 0 6px' }}>Set up your profile</h1>
          <p style={{ fontSize: 14, color: '#595959' }}>Your profile is how other brokers find and connect with you.</p>
        </div>

        {/* Avatar */}
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, padding: 24, marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 18 }}>Profile Photo</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#141414', border: '2px solid #262626', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>
              {avatarPreview ? <img src={avatarPreview} style={{ width: 72, height: 72, objectFit: 'cover' }} alt="" /> : '👤'}
            </div>
            <label style={{ cursor: 'pointer' }}>
              <div style={{ background: 'rgba(112,59,247,0.1)', border: '1px solid rgba(112,59,247,0.3)', borderRadius: 8, padding: '8px 16px', fontSize: 13, color: '#703BF7', fontWeight: 600 }}>Upload Photo</div>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)) } }} />
            </label>
          </div>
        </div>

        {/* Basic info */}
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, padding: 24, marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 18 }}>Basic Information</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Full Name *</label>
              <input type="text" value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} placeholder="Juan dela Cruz" style={inputStyle} onFocus={e => (e.target.style.borderColor = 'rgba(112,59,247,0.4)')} onBlur={e => (e.target.style.borderColor = '#1A1A1A')} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Professional Headline</label>
              <input type="text" value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} placeholder="e.g. Licensed Real Estate Broker · Cavite & Laguna Specialist" style={inputStyle} onFocus={e => (e.target.style.borderColor = 'rgba(112,59,247,0.4)')} onBlur={e => (e.target.style.borderColor = '#1A1A1A')} />
              <div style={{ fontSize: 11, color: '#595959', marginTop: 4 }}>{form.headline.length}/160</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Bio</label>
              <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={4} placeholder="Tell other brokers about your experience, specializations, and what makes you a great partner…" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} onFocus={e => (e.target.style.borderColor = 'rgba(112,59,247,0.4)')} onBlur={e => (e.target.style.borderColor = '#1A1A1A')} />
            </div>
            <div>
              <label style={labelStyle}>Location</label>
              <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Bacoor, Cavite" style={inputStyle} onFocus={e => (e.target.style.borderColor = 'rgba(112,59,247,0.4)')} onBlur={e => (e.target.style.borderColor = '#1A1A1A')} />
            </div>
            <div>
              <label style={labelStyle}>Years of Experience</label>
              <input type="number" min="0" max="50" value={form.years_experience} onChange={e => setForm(f => ({ ...f, years_experience: e.target.value }))} placeholder="e.g. 5" style={inputStyle} onFocus={e => (e.target.style.borderColor = 'rgba(112,59,247,0.4)')} onBlur={e => (e.target.style.borderColor = '#1A1A1A')} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Website</label>
              <input type="url" value={form.website_url} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))} placeholder="https://yourwebsite.com" style={inputStyle} onFocus={e => (e.target.style.borderColor = 'rgba(112,59,247,0.4)')} onBlur={e => (e.target.style.borderColor = '#1A1A1A')} />
            </div>
          </div>
        </div>

        {/* Specializations */}
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, padding: 24, marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Specializations</div>
          <p style={{ fontSize: 13, color: '#595959', marginBottom: 16 }}>Select all that apply — this helps other brokers find you for co-broking.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SPECIALIZATIONS.map(s => (
              <button key={s} onClick={() => toggleSpec(s)}
                style={{ padding: '7px 14px', borderRadius: 99, border: `1px solid ${form.specializations.includes(s) ? 'rgba(112,59,247,0.5)' : '#1A1A1A'}`, background: form.specializations.includes(s) ? 'rgba(112,59,247,0.15)' : '#141414', color: form.specializations.includes(s) ? '#703BF7' : '#595959', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                {form.specializations.includes(s) ? '✓ ' : ''}{s}
              </button>
            ))}
          </div>
        </div>

        {/* Languages */}
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, padding: 24, marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Languages</div>
          <p style={{ fontSize: 13, color: '#595959', marginBottom: 16 }}>Important for OFW clients — let them know you can communicate in their language.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {LANGUAGES.map(l => (
              <button key={l} onClick={() => toggleLang(l)}
                style={{ padding: '7px 14px', borderRadius: 99, border: `1px solid ${form.languages.includes(l) ? 'rgba(6,182,212,0.5)' : '#1A1A1A'}`, background: form.languages.includes(l) ? 'rgba(6,182,212,0.1)' : '#141414', color: form.languages.includes(l) ? '#06B6D4' : '#595959', fontSize: 13, cursor: 'pointer' }}>
                {form.languages.includes(l) ? '✓ ' : ''}{l}
              </button>
            ))}
          </div>
        </div>

        {/* Social links */}
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, padding: 24, marginBottom: 28 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 18 }}>Social Links</div>
          {[
            { key: 'facebook', label: '📘 Facebook', placeholder: 'https://facebook.com/yourpage' },
            { key: 'instagram', label: '📸 Instagram', placeholder: 'https://instagram.com/yourhandle' },
            { key: 'linkedin', label: '💼 LinkedIn', placeholder: 'https://linkedin.com/in/yourprofile' },
          ].map(s => (
            <div key={s.key} style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{s.label}</label>
              <input type="url" value={(form.social_links as any)[s.key]} onChange={e => setForm(f => ({ ...f, social_links: { ...f.social_links, [s.key]: e.target.value } }))} placeholder={s.placeholder} style={inputStyle} onFocus={e => (e.target.style.borderColor = 'rgba(112,59,247,0.4)')} onBlur={e => (e.target.style.borderColor = '#1A1A1A')} />
            </div>
          ))}
        </div>

        <button onClick={handleSave} disabled={saving || !form.display_name.trim()}
          style={{ width: '100%', background: saving || !form.display_name.trim() ? '#333' : '#703BF7', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 0', fontSize: 15, fontWeight: 700, cursor: saving || !form.display_name.trim() ? 'not-allowed' : 'pointer', boxShadow: saving || !form.display_name.trim() ? 'none' : '0 0 24px rgba(112,59,247,0.35)' }}>
          {saving ? 'Saving…' : 'Save Profile & Go to Feed →'}
        </button>
      </div>
    </div>
  )
}
