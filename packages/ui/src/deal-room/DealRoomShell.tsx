'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import { AdminNotice } from './AdminNotice'
import { PresenceBar } from './PresenceBar'
import { TransactionChecklist } from './TransactionChecklist'
import { MessageThread } from './MessageThread'
import { OfferThread } from './OfferThread'
import { DocumentVault } from './DocumentVault'

type Tab = 'messages' | 'offers' | 'documents'

interface Participant {
  id: string
  name: string
  role: 'buyer' | 'seller' | 'realtor'
}

interface CurrentUser {
  id: string
  name: string
  role: 'buyer' | 'seller' | 'realtor'
  sub: string
}

interface ChecklistItem {
  id: string
  label: string
  sort_order: number
  status: 'pending' | 'in_progress' | 'completed'
  updated_by?: string | null
  updated_at?: string | null
}

interface DealRoomShellProps {
  roomId: string
  currentUser: CurrentUser
  roomSecret: string
  roomStatus: string
  participants: Participant[]
  checklistItems: ChecklistItem[]
  supabaseUrl: string
  supabaseAnonKey: string
  /** Render prop for message thread content */
  messageThreadProps?: Omit<React.ComponentProps<typeof MessageThread>, 'roomId' | 'currentUser' | 'roomSecret' | 'channel'>
  /** Render prop for offer thread content */
  offerThreadProps?: Omit<React.ComponentProps<typeof OfferThread>, 'roomId' | 'currentUser' | 'roomStatus'>
  /** Render prop for document vault content */
  documentVaultProps?: Omit<React.ComponentProps<typeof DocumentVault>, 'roomId' | 'currentUser' | 'roomStatus' | 'channel'>
  onUpdateChecklistItem?: (itemId: string, status: 'pending' | 'in_progress' | 'completed') => Promise<void>
  onConfirmDealClose?: () => void
}

export function DealRoomShell({
  roomId,
  currentUser,
  roomSecret,
  roomStatus,
  participants,
  checklistItems,
  supabaseUrl,
  supabaseAnonKey,
  messageThreadProps,
  offerThreadProps,
  documentVaultProps,
  onUpdateChecklistItem,
  onConfirmDealClose,
}: DealRoomShellProps) {
  const [activeTab, setActiveTab] = useState<Tab>('messages')
  const [adminNoticeVisible, setAdminNoticeVisible] = useState(false)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const supabaseRef = useRef<SupabaseClient | null>(null)

  // Initialize Supabase client and subscribe to room channel
  useEffect(() => {
    if (!supabaseUrl || !supabaseAnonKey) return

    const client = createClient(supabaseUrl, supabaseAnonKey)
    supabaseRef.current = client

    const roomChannel = client
      .channel(`negotiation-room:${roomId}`)
      .on('broadcast', { event: 'admin_notice' }, () => {
        setAdminNoticeVisible(true)
      })

    roomChannel.subscribe()
    setChannel(roomChannel)

    return () => {
      client.removeChannel(roomChannel)
    }
  }, [roomId, supabaseUrl, supabaseAnonKey])

  const tabs: { id: Tab; label: string }[] = [
    { id: 'messages', label: 'Messages' },
    { id: 'offers', label: 'Offers' },
    { id: 'documents', label: 'Documents' },
  ]

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* Left sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-gray-800 flex flex-col bg-gray-900/50">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Deal Room</h2>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{roomId}</p>
        </div>

        {/* Checklist */}
        <div className="flex-1 overflow-y-auto p-4 border-b border-gray-800">
          <TransactionChecklist
            roomId={roomId}
            currentUser={currentUser}
            items={checklistItems}
            channel={channel}
            onUpdateItem={onUpdateChecklistItem}
            onConfirmComplete={onConfirmDealClose}
          />
        </div>

        {/* Presence */}
        <div className="p-4">
          <PresenceBar
            channel={channel}
            participants={participants}
            currentUserId={currentUser.id}
          />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Admin notice */}
        {adminNoticeVisible && (
          <div className="px-4 pt-3">
            <AdminNotice
              visible={adminNoticeVisible}
              onDismiss={() => setAdminNoticeVisible(false)}
            />
          </div>
        )}

        {/* Tab bar */}
        <div className="flex border-b border-gray-800 px-4 flex-shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 min-h-0">
          {activeTab === 'messages' && (
            <MessageThread
              roomId={roomId}
              currentUser={currentUser}
              roomSecret={roomSecret}
              channel={channel}
              {...messageThreadProps}
            />
          )}
          {activeTab === 'offers' && (
            <OfferThread
              roomId={roomId}
              currentUser={currentUser}
              roomStatus={roomStatus}
              offers={[]}
              {...offerThreadProps}
            />
          )}
          {activeTab === 'documents' && (
            <DocumentVault
              roomId={roomId}
              currentUser={currentUser}
              roomStatus={roomStatus}
              documents={[]}
              channel={channel}
              {...documentVaultProps}
            />
          )}
        </div>
      </main>
    </div>
  )
}
