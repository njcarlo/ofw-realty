'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { DealRoomShell } from '@ofw-realty/ui'
import { encrypt, deriveRoomKey } from '@ofw-realty/api-client'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

async function apiFetch(path: string, token: string, options?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export default function AgentDealRoomDetailPage() {
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
  const tokenRef = useRef<string | null>(null)

  // Fetch all room data in parallel
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
      tokenRef.current = jwt

      const user = session.user
      setCurrentUser({
        id: user.id,
        name: user.user_metadata?.full_name ?? user.email ?? 'Agent',
        role: 'realtor' as const,
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

  // Realtime: subscribe to offers and documents updates
  useEffect(() => {
    if (!token) return

    const channel = supabase
      .channel(`deal-room-data:${id}`)
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

  async function handleSendMessage(content: string, type: 'text' | 'image', file?: File) {
    const key = await deriveRoomKey(room.room_secret, currentUser.sub)

    if (type === 'image' && file) {
      // Upload image to Supabase Storage, then send message with attachment_url
      const ext = file.name.split('.').pop()
      const path = `${id}/images/${crypto.randomUUID()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('deal-room-docs')
        .upload(path, file, { contentType: file.type })
      if (uploadErr) throw uploadErr

      const { data: urlData } = supabase.storage.from('deal-room-docs').getPublicUrl(path)
      const { ciphertext, iv } = await encrypt(key, urlData.publicUrl)
      await apiFetch(`/negotiation-deal-rooms/${id}/messages`, token!, {
        method: 'POST',
        body: JSON.stringify({
          content_enc: ciphertext,
          content_iv: iv,
          message_type: 'image',
          attachment_url: urlData.publicUrl,
        }),
      })
    } else {
      const { ciphertext, iv } = await encrypt(key, content)
      await apiFetch(`/negotiation-deal-rooms/${id}/messages`, token!, {
        method: 'POST',
        body: JSON.stringify({ content_enc: ciphertext, content_iv: iv, message_type: 'text' }),
      })
    }
  }

  async function handleMarkRead(messageId: string) {
    await apiFetch(`/negotiation-deal-rooms/${id}/messages/${messageId}/read`, token!, { method: 'POST' })
  }

  async function handleAcceptOffer(offerId: string) {
    const offer = offers.find(o => o.id === offerId)
    await apiFetch(`/negotiation-deal-rooms/${id}/offers`, token!, {
      method: 'POST',
      body: JSON.stringify({
        offer_type: 'offer',
        amount_php: offer?.amount_php ?? 0,
        response_to_offer_id: offerId,
        response: 'accepted',
      }),
    })
    // Refresh room status after accept
    const updated = await apiFetch(`/negotiation-deal-rooms/${id}`, token!)
    setRoom(updated)
  }

  async function handleDeclineOffer(offerId: string) {
    const offer = offers.find(o => o.id === offerId)
    await apiFetch(`/negotiation-deal-rooms/${id}/offers`, token!, {
      method: 'POST',
      body: JSON.stringify({
        offer_type: 'offer',
        amount_php: offer?.amount_php ?? 0,
        response_to_offer_id: offerId,
        response: 'declined',
      }),
    })
  }

  async function handleCounterOffer(offerId: string, amount: number, conditions: string) {
    await apiFetch(`/negotiation-deal-rooms/${id}/offers`, token!, {
      method: 'POST',
      body: JSON.stringify({
        offer_type: 'counter_offer',
        amount_php: amount,
        conditions: conditions || undefined,
        response_to_offer_id: offerId,
        response: 'countered',
      }),
    })
  }

  async function handleUploadDocument(file: File, category: string) {
    // Step 1: get signed upload URL + create document record
    const { upload_url } = await apiFetch(`/negotiation-deal-rooms/${id}/documents`, token!, {
      method: 'POST',
      body: JSON.stringify({
        file_name: file.name,
        file_type: file.name.split('.').pop()?.toLowerCase() ?? 'other',
        file_size_bytes: file.size,
        category,
      }),
    })
    // Step 2: PUT the file to the signed URL
    const uploadRes = await fetch(upload_url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    })
    if (!uploadRes.ok) throw new Error('File upload failed')
  }

  async function handleDownloadDocument(docId: string) {
    const { url } = await apiFetch(`/negotiation-deal-rooms/${id}/documents/${docId}/url`, token!)
    window.open(url, '_blank')
  }

  async function handleDeleteDocument(docId: string) {
    await apiFetch(`/negotiation-deal-rooms/${id}/documents/${docId}`, token!, { method: 'DELETE' })
  }

  async function handleUpdateChecklist(itemId: string, status: 'pending' | 'in_progress' | 'completed') {
    await apiFetch(`/negotiation-deal-rooms/${id}/checklist/${itemId}`, token!, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  }

  async function handleConfirmDealClose() {
    await apiFetch(`/negotiation-deal-rooms/${id}/status`, token!, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'closed' }),
    })
    setRoom((prev: any) => prev ? { ...prev, status: 'closed' } : prev)
  }

  return (
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
        onSendMessage: handleSendMessage,
        onMarkRead: handleMarkRead,
      }}
      offerThreadProps={{
        offers,
        onAccept: handleAcceptOffer,
        onDecline: handleDeclineOffer,
        onCounter: handleCounterOffer,
      }}
      documentVaultProps={{
        documents,
        onUpload: handleUploadDocument,
        onDownload: handleDownloadDocument,
        onDelete: handleDeleteDocument,
      }}
      onUpdateChecklistItem={handleUpdateChecklist}
      onConfirmDealClose={handleConfirmDealClose}
    />
  )
}
