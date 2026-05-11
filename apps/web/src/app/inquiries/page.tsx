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

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:   { bg: 'rgba(245,158,11,0.15)',  color: '#F59E0B' },
  responded: { bg: 'rgba(16,185,129,0.15)',  color: '#10B981' },
  closed:    { bg: 'rgba(89,89,89,0.15)',    color: '#595959' },
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token
      if (!token) { setLoading(false); return }
      setAuthed(true)
      try {
        const res = await fetch(`${API}/inquiries/my`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) setInquiries(await res.json())
      } catch {}
      setLoading(false)
    })
  }, [])

  return (
    <PageShell badge="My Dashboard" title="Active Inquiries" subtitle="Track your property inquiries and offers." backHref="/dashboard" backLabel="Dashboard">
      {!authed ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Sign in to view your inquiries.</p>
          <Link href="/login" style={{ background: '#703BF7', color: '#fff', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
        </div>
      ) : loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading inquiries…</p>
      ) : inquiries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>💬</div>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>No inquiries yet. Find a property and send your first inquiry.</p>
          <Link href="/map" style={{ background: '#703BF7', color: '#fff', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Browse Properties</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {inquiries.map((inq: any) => {
            const s = STATUS_STYLE[inq.status] ?? STATUS_STYLE.pending
            return (
              <div key={inq.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{inq.listing_title ?? 'Property Inquiry'}</div>
                    {inq.offer_price && (
                      <div style={{ fontSize: 14, color: '#703BF7', fontWeight: 600 }}>Offer: ₱{Number(inq.offer_price).toLocaleString()}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: s.bg, color: s.color, textTransform: 'capitalize' }}>
                      {inq.status}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(inq.created_at)}</span>
                  </div>
                </div>
                {inq.message && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>"{inq.message}"</p>
                )}
                {inq.realtor_name && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Agent: {inq.realtor_name}</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
