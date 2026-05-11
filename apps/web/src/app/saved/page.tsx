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
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://ofw-realty-web.vercel.app'

export default function SavedPage() {
  const [saved, setSaved] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token
      if (!token) { setLoading(false); return }
      setAuthed(true)
      try {
        const res = await fetch(`${API}/saved-listings`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) setSaved(await res.json())
      } catch {}
      setLoading(false)
    })
  }, [])

  return (
    <PageShell badge="My Dashboard" title="Saved Properties" subtitle="Properties you've bookmarked for later." backHref="/dashboard" backLabel="Dashboard">
      {!authed ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Sign in to view your saved properties.</p>
          <Link href="/login" style={{ background: '#703BF7', color: '#fff', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            Sign In
          </Link>
        </div>
      ) : loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading saved properties…</p>
      ) : saved.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🏠</div>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>You haven't saved any properties yet.</p>
          <Link href="/map" style={{ background: '#703BF7', color: '#fff', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            Browse Properties
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {saved.map((item: any) => (
            <a key={item.id} href={`${WEB_URL}/listings/${item.listing_id ?? item.id}`} style={{ display: 'block', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', textDecoration: 'none', color: 'inherit' }}>
              {item.photo_url && (
                <img src={item.photo_url} alt={item.title} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
              )}
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{item.title ?? 'Property'}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>📍 {item.city}, {item.province}</div>
                {item.price_php && (
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#703BF7', marginTop: 8 }}>₱{Number(item.price_php).toLocaleString()}</div>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </PageShell>
  )
}
