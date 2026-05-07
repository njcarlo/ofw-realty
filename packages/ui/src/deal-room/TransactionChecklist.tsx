'use client'
import { useEffect, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'

type ChecklistStatus = 'pending' | 'in_progress' | 'completed'

interface ChecklistItem {
  id: string
  label: string
  sort_order: number
  status: ChecklistStatus
  updated_by?: string | null
  updated_at?: string | null
}

interface CurrentUser {
  id: string
  role: 'buyer' | 'seller' | 'realtor'
}

interface TransactionChecklistProps {
  roomId: string
  currentUser: CurrentUser
  items: ChecklistItem[]
  channel: RealtimeChannel | null
  onUpdateItem?: (itemId: string, status: ChecklistStatus) => Promise<void>
  onConfirmComplete?: () => void
}

const STATUS_BADGE: Record<ChecklistStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-gray-700 text-gray-400' },
  in_progress: { label: 'In Progress', className: 'bg-blue-900/50 text-blue-300' },
  completed: { label: 'Completed', className: 'bg-green-900/50 text-green-400' },
}

export function TransactionChecklist({
  currentUser,
  items: initialItems,
  channel,
  onUpdateItem,
  onConfirmComplete,
}: TransactionChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>(initialItems)
  const [showConfirm, setShowConfirm] = useState(false)

  // Sync prop changes
  useEffect(() => { setItems(initialItems) }, [initialItems])

  // Real-time checklist updates
  useEffect(() => {
    if (!channel) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    channel.on('postgres_changes' as any, { event: 'UPDATE', schema: 'public', table: 'negotiation_checklist_items' }, (payload: any) => {
      setItems(prev =>
        prev.map(item => item.id === payload.new.id ? { ...item, ...payload.new } : item)
      )
    })
  }, [channel])

  const canEdit = currentUser.role === 'realtor' || currentUser.role === 'seller'
  const completedCount = items.filter(i => i.status === 'completed').length
  const totalCount = items.length
  const progressPct = totalCount > 0 ? Math.floor((completedCount / totalCount) * 100) : 0
  const allComplete = completedCount === totalCount && totalCount > 0

  useEffect(() => {
    if (allComplete && canEdit) setShowConfirm(true)
  }, [allComplete, canEdit])

  async function handleStatusClick(item: ChecklistItem) {
    if (!canEdit || !onUpdateItem) return
    const next: ChecklistStatus =
      item.status === 'pending' ? 'in_progress'
      : item.status === 'in_progress' ? 'completed'
      : 'pending'
    await onUpdateItem(item.id, next)
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Progress</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="space-y-1">
        {[...items].sort((a, b) => a.sort_order - b.sort_order).map(item => (
          <button
            key={item.id}
            onClick={() => handleStatusClick(item)}
            disabled={!canEdit || !onUpdateItem}
            className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-left transition-colors ${
              canEdit ? 'hover:bg-white/5 cursor-pointer' : 'cursor-default'
            }`}
          >
            <span className="text-xs text-gray-300 truncate">{item.label}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${STATUS_BADGE[item.status].className}`}>
              {STATUS_BADGE[item.status].label}
            </span>
          </button>
        ))}
      </div>

      {showConfirm && onConfirmComplete && (
        <div className="mt-2 p-3 bg-green-900/30 border border-green-700/40 rounded-lg space-y-2">
          <p className="text-xs text-green-300">All items complete. Mark deal as closed?</p>
          <div className="flex gap-2">
            <button
              onClick={() => { onConfirmComplete(); setShowConfirm(false) }}
              className="flex-1 text-xs py-1.5 bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
            >
              Confirm Close
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 text-xs py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            >
              Not yet
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
