'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { PageShell } from '@/components/PageShell'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://ofw-realty-api-production.up.railway.app'

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function ViewingsPage() {
  const [viewings, setViewings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token
      if (!token) { setLoading(false); return }
      setAuthed(true)
      try {
        const res = await fetch(`${API}/viewings/my`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) setViewings(await res.json())
      } catch {}
      setLoading(false)
    })
  }, [])

  const upcoming = viewings.filter(v => new Date(v.scheduled_at) > new Date())
  const past = viewings.filter(v => new Date(v.scheduled_at) <= new Date())

  return (
    <PageShell badge="My Dashboard" title="Scheduled Viewings" subtitle="Upcoming property viewings and site visits." backHref="/dashboard" backLabel="Dashboard">
      {!authed ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Sign in to view your scheduled viewings.</p>
          <Link href="/login" style={{ background: '#703BF7', color: '#fff', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
        </div>
      ) : loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading viewings…</p>
      ) : viewings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📅</div>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>No viewings scheduled yet. Contact an agent to arrange a viewing.</p>
          <Link href="/agents" style={{ background: '#703BF7', color: '#fff', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Find an Agent</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {upcoming.length > 0 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Upcoming</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {upcoming.map((v: any) => (
                  <div key={v.id} style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(112,59,247,0.25)', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{v.listing_title ?? 'Property Viewing'}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>📅 {formatDateTime(v.scheduled_at)}</div>
                      {v.realtor_name && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Agent: {v.realtor_name}</div>}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: 'rgba(112,59,247,0.15)', color: '#703BF7' }}>
                      {v.type === 'virtual' ? '💻 Virtual' : '📍 In-Person'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Past Viewings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {past.map((v: any) => (
                  <div key={v.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.7 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{v.listing_title ?? 'Property Viewing'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>📅 {formatDateTime(v.scheduled_at)}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: 'rgba(89,89,89,0.15)', color: '#595959' }}>Completed</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </PageShell>
  )
}
