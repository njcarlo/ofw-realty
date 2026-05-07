'use client'
import { useEffect, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface Participant {
  id: string
  name: string
  role: 'buyer' | 'seller' | 'realtor'
}

interface PresenceState {
  [key: string]: { user_id: string }[]
}

interface PresenceBarProps {
  channel: RealtimeChannel | null
  participants: Participant[]
  currentUserId: string
}

const ROLE_LABELS: Record<string, string> = {
  buyer: 'Buyer',
  seller: 'Seller',
  realtor: 'Realtor',
}

export function PresenceBar({ channel, participants, currentUserId }: PresenceBarProps) {
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!channel) return

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as PresenceState
        const ids = new Set<string>()
        Object.values(state).forEach(presences => {
          presences.forEach(p => ids.add(p.user_id))
        })
        setOnlineIds(ids)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: currentUserId })
        }
      })

    return () => {
      channel.untrack()
    }
  }, [channel, currentUserId])

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 mb-2">
        Participants
      </p>
      {participants.map(p => {
        const online = onlineIds.has(p.id)
        return (
          <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5">
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${online ? 'bg-green-400' : 'bg-gray-600'}`}
              aria-label={online ? 'Online' : 'Offline'}
            />
            <div className="min-w-0">
              <p className="text-sm text-gray-200 truncate">{p.name}</p>
              <p className="text-xs text-gray-500">{ROLE_LABELS[p.role] ?? p.role}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
