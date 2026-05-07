'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { DealRoomDashboard } from '@ofw-realty/ui'
import { AgentSidebar } from '@/components/AgentSidebar'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export default function AgentDealRoomsPage() {
  const router = useRouter()
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '' as any, listing_id: '' })

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token
      if (!token) { router.replace('/login'); return }
      try {
        const res = await fetch(`${API}/negotiation-deal-rooms`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) setRooms(await res.json())
      } finally {
        setLoading(false)
      }
    })
  }, [router])

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <AgentSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Deal Rooms</h1>
          <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>Manage your active negotiations</p>
        </div>

        {loading ? (
          <div style={{ color: '#595959', fontSize: 14 }}>Loading…</div>
        ) : (
          <DealRoomDashboard
            rooms={rooms}
            filters={filters}
            onFilterChange={setFilters}
            onRoomClick={(roomId) => router.push(`/deal-rooms/${roomId}`)}
          />
        )}
      </main>
    </div>
  )
}
