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

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function MessagesPage() {
  const [threads, setThreads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token
      if (!token) { setLoading(false); return }
      setAuthed(true)
      try {
        const res = await fetch(`${API}/chat/threads`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) setThreads(await res.json())
      } catch {}
      setLoading(false)
    })
  }, [])

  return (
    <PageShell badge="My Dashboard" title="Messages" subtitle="Chat with agents and brokers about properties." backHref="/dashboard" backLabel="Dashboard">
      {!authed ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Sign in to view your messages.</p>
          <Link href="/login" style={{ background: '#703BF7', color: '#fff', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
        </div>
      ) : loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading messages…</p>
      ) : threads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>💬</div>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>No messages yet. Inquire about a property to start a conversation.</p>
          <Link href="/map" style={{ background: '#703BF7', color: '#fff', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Browse Properties</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {threads.map((thread: any) => (
            <a
              key={thread.id}
              href={`/messages/${thread.id}`}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, textDecoration: 'none', color: 'inherit', marginBottom: 8 }}
            >
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(112,59,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                {thread.realtor_photo ? <img src={thread.realtor_photo} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} /> : '👤'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{thread.realtor_name ?? 'Agent'}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(thread.last_message_at ?? thread.created_at)}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {thread.last_message ?? thread.listing_title ?? 'Property inquiry'}
                </div>
              </div>
              {thread.unread_count > 0 && (
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#703BF7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {thread.unread_count}
                </div>
              )}
            </a>
          ))}
        </div>
      )}
    </PageShell>
  )
}
