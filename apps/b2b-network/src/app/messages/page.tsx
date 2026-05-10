'use client'
import { useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Sidebar } from '@/components/Sidebar'
import type { B2BProfile } from '@/lib/types'

interface Message { id: string; sender_id: string; recipient_id: string; content: string; read_at: string | null; created_at: string }
interface Thread { profile: B2BProfile; lastMessage: string; lastAt: string; unread: number }

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#595959', fontFamily: 'Inter, sans-serif' }}>Loading…</div>}>
      <MessagesInner />
    </Suspense>
  )
}

function MessagesInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [myProfile, setMyProfile] = useState<B2BProfile | null>(null)
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeProfile, setActiveProfile] = useState<B2BProfile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session
      if (!session) { router.replace('/login'); return }
      const { data: prof } = await supabase.from('b2b_profiles').select('*').eq('user_id', session.user.id).maybeSingle()
      if (!prof) { router.replace('/profile/setup'); return }
      setMyProfile(prof)

      // Load threads
      const { data: msgs } = await supabase.from('b2b_messages')
        .select('*').or(`sender_id.eq.${prof.id},recipient_id.eq.${prof.id}`)
        .order('created_at', { ascending: false }).limit(100)

      if (msgs) {
        const partnerIds = [...new Set(msgs.map(m => m.sender_id === prof.id ? m.recipient_id : m.sender_id))]
        const { data: partnerProfiles } = await supabase.from('b2b_profiles').select('*').in('id', partnerIds)
        const profileMap = Object.fromEntries((partnerProfiles ?? []).map(p => [p.id, p]))

        const threadMap: Record<string, Thread> = {}
        msgs.forEach(m => {
          const partnerId = m.sender_id === prof.id ? m.recipient_id : m.sender_id
          if (!threadMap[partnerId]) {
            threadMap[partnerId] = { profile: profileMap[partnerId], lastMessage: m.content, lastAt: m.created_at, unread: 0 }
          }
          if (!m.read_at && m.recipient_id === prof.id) threadMap[partnerId].unread++
        })
        setThreads(Object.values(threadMap))

        // Auto-open thread from query param
        const toId = searchParams.get('to')
        if (toId && profileMap[toId]) {
          openThread(profileMap[toId], prof, msgs.filter(m => m.sender_id === toId || m.recipient_id === toId))
        }
      }
      setLoading(false)
    })
  }, [router, searchParams])

  function openThread(partner: B2BProfile, me: B2BProfile, allMsgs?: Message[]) {
    setActiveProfile(partner)
    const threadMsgs = (allMsgs ?? messages).filter(m =>
      (m.sender_id === me.id && m.recipient_id === partner.id) ||
      (m.sender_id === partner.id && m.recipient_id === me.id)
    ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    setMessages(threadMsgs)
    // Mark as read
    supabase.from('b2b_messages').update({ read_at: new Date().toISOString() })
      .eq('recipient_id', me.id).eq('sender_id', partner.id).is('read_at', null).then(() => {
        setThreads(prev => prev.map(t => t.profile.id === partner.id ? { ...t, unread: 0 } : t))
      })
  }

  async function handleSend() {
    if (!text.trim() || !myProfile || !activeProfile) return
    setSending(true)
    const { data } = await supabase.from('b2b_messages').insert({
      sender_id: myProfile.id, recipient_id: activeProfile.id, content: text.trim(),
    }).select().single()
    if (data) {
      setMessages(prev => [...prev, data])
      setText('')
      setThreads(prev => {
        const existing = prev.find(t => t.profile.id === activeProfile.id)
        if (existing) return prev.map(t => t.profile.id === activeProfile.id ? { ...t, lastMessage: data.content, lastAt: data.created_at } : t)
        return [{ profile: activeProfile, lastMessage: data.content, lastAt: data.created_at, unread: 0 }, ...prev]
      })
    }
    setSending(false)
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: 'Inter, sans-serif', color: '#fff' }}>
      <Sidebar profile={myProfile ?? undefined} />

      {/* Thread list */}
      <div style={{ width: 280, borderRight: '1px solid #1A1A1A', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid #1A1A1A' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Messages</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? <div style={{ padding: 20, color: '#595959', fontSize: 13 }}>Loading…</div> :
            threads.length === 0 ? <div style={{ padding: 20, color: '#595959', fontSize: 13 }}>No messages yet. Connect with brokers to start chatting.</div> :
            threads.map(t => (
              <button key={t.profile.id} onClick={() => myProfile && openThread(t.profile, myProfile)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: activeProfile?.id === t.profile.id ? 'rgba(112,59,247,0.1)' : 'transparent', border: 'none', borderBottom: '1px solid #141414', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(112,59,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                  {t.profile.avatar_url ? <img src={t.profile.avatar_url} style={{ width: 40, height: 40, objectFit: 'cover' }} alt="" /> : '👤'}
                  {t.unread > 0 && <span style={{ position: 'absolute', top: 0, right: 0, width: 14, height: 14, borderRadius: '50%', background: '#703BF7', fontSize: 9, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{t.unread}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: t.unread > 0 ? 700 : 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.profile.display_name}</div>
                  <div style={{ fontSize: 11, color: '#595959', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.lastMessage}</div>
                </div>
                <div style={{ fontSize: 10, color: '#595959', flexShrink: 0 }}>{formatTime(t.lastAt)}</div>
              </button>
            ))
          }
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!activeProfile ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#595959', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 40 }}>💬</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Select a conversation</div>
            <div style={{ fontSize: 14 }}>Or <a href="/discover" style={{ color: '#703BF7' }}>discover brokers</a> to connect with</div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #1A1A1A', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(112,59,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, overflow: 'hidden' }}>
                {activeProfile.avatar_url ? <img src={activeProfile.avatar_url} style={{ width: 40, height: 40, objectFit: 'cover' }} alt="" /> : '👤'}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {activeProfile.display_name}
                  {activeProfile.prc_verified && <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.15)', color: '#10B981', padding: '2px 5px', borderRadius: 99 }}>✓ PRC</span>}
                </div>
                <div style={{ fontSize: 12, color: '#595959' }}>{activeProfile.headline ?? 'Real Estate Professional'}</div>
              </div>
              <a href={`/profile/${activeProfile.id}`} style={{ marginLeft: 'auto', fontSize: 12, color: '#703BF7', border: '1px solid rgba(112,59,247,0.3)', borderRadius: 6, padding: '5px 10px' }}>View Profile</a>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px' }}>
              {messages.map(m => {
                const isMine = m.sender_id === myProfile?.id
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                    <div style={{ maxWidth: '70%', background: isMine ? '#703BF7' : '#141414', borderRadius: isMine ? '16px 16px 4px 16px' : '4px 16px 16px 16px', padding: '10px 14px', fontSize: 14, color: '#fff', lineHeight: 1.5 }}>
                      {m.content}
                      <div style={{ fontSize: 10, color: isMine ? 'rgba(255,255,255,0.6)' : '#595959', marginTop: 4, textAlign: 'right' }}>{formatTime(m.created_at)}</div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #1A1A1A', display: 'flex', gap: 10 }}>
              <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder="Type a message…" disabled={sending}
                style={{ flex: 1, background: '#0D0D0D', border: '1px solid #262626', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#fff', outline: 'none' }}
                onFocus={e => (e.target.style.borderColor = 'rgba(112,59,247,0.4)')}
                onBlur={e => (e.target.style.borderColor = '#262626')}
              />
              <button onClick={handleSend} disabled={sending || !text.trim()}
                style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: sending || !text.trim() ? '#1A1A1A' : '#703BF7', color: sending || !text.trim() ? '#595959' : '#fff', fontSize: 16, cursor: sending || !text.trim() ? 'not-allowed' : 'pointer' }}>
                ➤
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
