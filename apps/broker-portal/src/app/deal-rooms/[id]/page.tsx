'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { DealRoomShell } from '@ofw-realty/ui'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export default function BrokerDealRoomDetailPage() {
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
      if (!session) { router.replace('/login'); return }
      const jwt = session.access_token
      setToken(jwt)

      const user = session.user
      // Brokers are read-only observers — role set to realtor for shell compatibility
      setCurrentUser({
        id: user.id,
        name: user.user_metadata?.full_name ?? user.email ?? 'Broker',
        role: 'realtor' as const,
        sub: user.id,
      })

      try {
        const res = await fetch(`${API}/negotiation-deal-rooms/${id}`, {
          headers: { Authorization: `Bearer ${jwt}` },
        })
        if (!res.ok) throw new Error(await res.text())
        setRoom(await res.json())
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

  // Broker is read-only: no send/upload/delete/checklist callbacks passed
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
      }}
      offerThreadProps={{
        offers: room.offers ?? [],
      }}
      documentVaultProps={{
        documents: room.documents ?? [],
        onDownload: async (docId) => {
          const res = await fetch(`${API}/negotiation-deal-rooms/${id}/documents/${docId}/url`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          const { url } = await res.json()
          window.open(url, '_blank')
        },
      }}
    />
  )
}
