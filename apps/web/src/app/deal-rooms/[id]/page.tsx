'use client'
import { useEffect, useState } from 'react'
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

export default function BuyerDealRoomPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [token, setToken] = useState<string | null>(null)
  const [room, setRoom] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session
      if (!session) {
        router.replace('/login')
        return
      }
      const jwt = session.access_token
      setToken(jwt)

      const user = session.user
      setCurrentUser({
        id: user.id,
        name: user.user_metadata?.full_name ?? user.email ?? 'Buyer',
        role: 'buyer' as const,
        sub: user.id,
      })

      try {
        const roomData = await apiFetch(`/negotiation-deal-rooms/${id}`, jwt)
        setRoom(roomData)
      } catch (e: any) {
        setError(e.message ?? 'Failed to load deal room')
      } finally {
        setLoading(false)
      }
    })
  }, [id, router])

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
    const { ciphertext, iv } = await encrypt(key, content)
    await apiFetch(`/negotiation-deal-rooms/${id}/messages`, token!, {
      method: 'POST',
      body: JSON.stringify({ content_enc: ciphertext, content_iv: iv, message_type: type }),
    })
  }

  async function handleMarkRead(messageId: string) {
    await apiFetch(`/negotiation-deal-rooms/${id}/messages/${messageId}/read`, token!, { method: 'POST' })
  }

  async function handleSubmitOffer(amount: number, paymentMethod: string, conditions: string) {
    await apiFetch(`/negotiation-deal-rooms/${id}/offers`, token!, {
      method: 'POST',
      body: JSON.stringify({ offer_type: 'offer', amount_php: amount, payment_method: paymentMethod, conditions }),
    })
  }

  async function handleAcceptOffer(offerId: string) {
    await apiFetch(`/negotiation-deal-rooms/${id}/offers`, token!, {
      method: 'POST',
      body: JSON.stringify({ offer_type: 'counter_offer', response: 'accepted', offer_id: offerId }),
    })
  }

  async function handleDeclineOffer(offerId: string) {
    await apiFetch(`/negotiation-deal-rooms/${id}/offers`, token!, {
      method: 'POST',
      body: JSON.stringify({ offer_type: 'counter_offer', response: 'declined', offer_id: offerId }),
    })
  }

  async function handleCounterOffer(offerId: string, amount: number, conditions: string) {
    await apiFetch(`/negotiation-deal-rooms/${id}/offers`, token!, {
      method: 'POST',
      body: JSON.stringify({ offer_type: 'counter_offer', amount_php: amount, conditions, offer_id: offerId }),
    })
  }

  async function handleUploadDocument(file: File, category: string) {
    const { upload_url, document_id } = await apiFetch(`/negotiation-deal-rooms/${id}/documents`, token!, {
      method: 'POST',
      body: JSON.stringify({ file_name: file.name, file_type: file.name.split('.').pop(), file_size_bytes: file.size, category }),
    })
    await fetch(upload_url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
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

  async function handleUpdateStatus(newStatus: string) {
    await apiFetch(`/negotiation-deal-rooms/${id}/status`, token!, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    })
  }

  return (
    <DealRoomShell
      roomId={id}
      currentUser={currentUser}
      roomSecret={room.room_secret}
      roomStatus={room.status}
      participants={room.participants ?? []}
      checklistItems={room.checklist ?? []}
      supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
      supabaseAnonKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}
      messageThreadProps={{
        initialMessages: room.messages ?? [],
        onSendMessage: handleSendMessage,
        onMarkRead: handleMarkRead,
      }}
      offerThreadProps={{
        offers: room.offers ?? [],
        onAccept: handleAcceptOffer,
        onDecline: handleDeclineOffer,
        onCounter: handleCounterOffer,
      }}
      documentVaultProps={{
        documents: room.documents ?? [],
        onUpload: handleUploadDocument,
        onDownload: handleDownloadDocument,
        onDelete: handleDeleteDocument,
      }}
      onUpdateChecklistItem={handleUpdateChecklist}
    />
  )
}
