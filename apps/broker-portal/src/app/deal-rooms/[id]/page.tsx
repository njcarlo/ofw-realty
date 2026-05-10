'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { DealRoomShell } from '@ofw-realty/ui'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

async function apiFetch(path: string, token: string) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export default function BrokerDealRoomDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [token, setToken] = useState<string | null>(null)
  const [room, setRoom] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [offers, setOffers] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [checklist, setChecklist] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRoomData = useCallback(async (jwt: string) => {
    const [roomData, msgs, offrs, docs, checklistData] = await Promise.all([
      apiFetch(`/negotiation-deal-rooms/${id}`, jwt),
      apiFetch(`/negotiation-deal-rooms/${id}/messages`, jwt),
      apiFetch(`/negotiation-deal-rooms/${id}/offers`, jwt),
      apiFetch(`/negotiation-deal-rooms/${id}/documents`, jwt),
      apiFetch(`/negotiation-deal-rooms/${id}/checklist`, jwt),
    ])
    setRoom(roomData)
    setMessages(msgs ?? [])
    setOffers(offrs ?? [])
    setDocuments(docs ?? [])
    setChecklist(checklistData?.items ?? checklistData ?? [])
  }, [id])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session
      if (!session) { router.replace('/login'); return }
      const jwt = session.access_token
      setToken(jwt)

      const user = session.user
      setCurrentUser({
        id: user.id,
        name: user.user_metadata?.full_name ?? user.email ?? 'Broker',
        role: 'realtor' as const, // shell compatibility
        sub: user.id,
      })

      try {
        await fetchRoomData(jwt)
      } catch (e: any) {
        setError(e.message ?? 'Failed to load deal room')
      } finally {
        setLoading(false)
      }
    })
  }, [id, router, fetchRoomData])

  // Realtime: subscribe to offers and documents for live oversight
  useEffect(() => {
    if (!token) return

    const channel = supabase
      .channel(`broker-deal-room-data:${id}`)
      .on('postgres_changes' as any, {
        event: 'INSERT',
        schema: 'public',
        table: 'negotiation_offers',
        filter: `room_id=eq.${id}`,
      }, (payload: any) => {
        setOffers(prev => prev.some(o => o.id === payload.new.id) ? prev : [...prev, payload.new])
      })
      .on('postgres_changes' as any, {
        event: 'UPDATE',
        schema: 'public',
        table: 'negotiation_offers',
        filter: `room_id=eq.${id}`,
      }, (payload: any) => {
        setOffers(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o))
      })
      .on('postgres_changes' as any, {
        event: 'INSERT',
        schema: 'public',
        table: 'negotiation_documents',
        filter: `room_id=eq.${id}`,
      }, (payload: any) => {
        setDocuments(prev => prev.some(d => d.id === payload.new.id) ? prev : [...prev, payload.new])
      })
      .on('postgres_changes' as any, {
        event: 'UPDATE',
        schema: 'public',
        table: 'negotiation_documents',
        filter: `room_id=eq.${id}`,
      }, (payload: any) => {
        if (payload.new.deleted_at) {
          setDocuments(prev => prev.filter(d => d.id !== payload.new.id))
        }
      })
      .on('postgres_changes' as any, {
        event: 'UPDATE',
        schema: 'public',
        table: 'negotiation_rooms',
        filter: `id=eq.${id}`,
      }, (payload: any) => {
        setRoom((prev: any) => prev ? { ...prev, ...payload.new } : prev)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id, token])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#595959', fontFamily: "'Inter', system-ui, sans-serif" }}>
        Loading deal room…
      </div>
    )
  }

  if (error || !room || !currentUser || !token) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', fontFamily: "'Inter', system-ui, sans-serif" }}>
        {error ?? 'Deal room not found.'}
      </div>
    )
  }

  // Broker is read-only: no send/upload/delete/checklist callbacks
  return (
    <div style={{ position: 'relative' }}>
      {/* Read-only banner */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(245,158,11,0.1)', borderBottom: '1px solid rgba(245,158,11,0.25)',
        padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 13, color: '#F59E0B', fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        <span>👁</span>
        <span>Broker oversight view — read only. You can view all activity but cannot send messages or modify this room.</span>
      </div>
      <div style={{ paddingTop: 40 }}>
        <DealRoomShell
          roomId={id}
          currentUser={currentUser}
          roomSecret={room.room_secret}
          roomStatus={room.status}
          participants={room.participants ?? []}
          checklistItems={checklist}
          supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
          supabaseAnonKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}
          messageThreadProps={{
            initialMessages: messages,
            // No onSendMessage — read only
          }}
          offerThreadProps={{
            offers,
            // No accept/decline/counter — read only
          }}
          documentVaultProps={{
            documents,
            onDownload: async (docId) => {
              const { url } = await apiFetch(`/negotiation-deal-rooms/${id}/documents/${docId}/url`, token)
              window.open(url, '_blank')
            },
            // No onUpload/onDelete — read only
          }}
          // No checklist update or deal close — read only
        />
      </div>
    </div>
  )
}
