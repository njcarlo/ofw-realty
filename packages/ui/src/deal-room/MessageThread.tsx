'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { deriveRoomKey, decrypt } from '@ofw-realty/api-client'

interface MessageRead {
  reader_id: string
  reader_name: string
}

interface Message {
  id: string
  sender_id: string
  sender_name: string
  sender_role: 'buyer' | 'seller' | 'realtor'
  content_enc: string
  content_iv: string
  message_type: 'text' | 'image'
  attachment_url?: string | null
  created_at: string
  reads: MessageRead[]
}

interface CurrentUser {
  id: string
  name: string
  role: 'buyer' | 'seller' | 'realtor'
  sub: string // JWT sub claim
}

interface MessageThreadProps {
  roomId: string
  currentUser: CurrentUser
  roomSecret: string
  channel: RealtimeChannel | null
  initialMessages?: Message[]
  onSendMessage?: (content: string, type: 'text' | 'image', file?: File) => Promise<void>
  onMarkRead?: (messageId: string) => Promise<void>
}

const ROLE_LABELS: Record<string, string> = { buyer: 'Buyer', seller: 'Seller', realtor: 'Realtor' }
const MAX_IMAGE_BYTES = 10 * 1024 * 1024 // 10 MB

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
}

export function MessageThread({
  currentUser,
  roomSecret,
  channel,
  initialMessages = [],
  onSendMessage,
  onMarkRead,
}: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [decrypted, setDecrypted] = useState<Record<string, string>>({})
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Derive room key once
  useEffect(() => {
    deriveRoomKey(roomSecret, currentUser.sub).then(setCryptoKey).catch(console.error)
  }, [roomSecret, currentUser.sub])

  // Decrypt messages when key or messages change
  useEffect(() => {
    if (!cryptoKey) return
    const pending = messages.filter(m => !(m.id in decrypted))
    if (pending.length === 0) return
    Promise.all(
      pending.map(async m => {
        try {
          const plain = await decrypt(cryptoKey, m.content_enc, m.content_iv)
          return [m.id, plain] as const
        } catch {
          return [m.id, '[Message could not be decrypted]'] as const
        }
      })
    ).then(results => {
      setDecrypted(prev => {
        const next = { ...prev }
        results.forEach(([id, text]) => { next[id] = text })
        return next
      })
    })
  }, [cryptoKey, messages, decrypted])

  // Sync initial messages
  useEffect(() => { setMessages(initialMessages) }, [initialMessages])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Realtime: new messages + typing indicators
  useEffect(() => {
    if (!channel) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    channel.on('postgres_changes' as any, { event: 'INSERT', schema: 'public', table: 'negotiation_messages' }, (payload: any) => {
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev
          return [...prev, { ...payload.new, reads: [] }]
        })
        if (payload.new.sender_id !== currentUser.id && onMarkRead) {
          onMarkRead(payload.new.id).catch(console.error)
        }
      }
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    channel.on('postgres_changes' as any, { event: 'INSERT', schema: 'public', table: 'negotiation_message_reads' }, (payload: any) => {
        setMessages(prev =>
          prev.map(m =>
            m.id === payload.new.message_id && !m.reads.some((r: MessageRead) => r.reader_id === payload.new.reader_id)
              ? { ...m, reads: [...m.reads, { reader_id: payload.new.reader_id, reader_name: '' }] }
              : m
          )
        )
      }
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    channel.on('broadcast', { event: 'typing' }, (payload: any) => {
      const { user_id, name, is_typing } = payload.payload
      if (user_id === currentUser.id) return
      setTypingUsers(prev =>
        is_typing ? (prev.includes(name) ? prev : [...prev, name]) : prev.filter((n: string) => n !== name)
      )
    })
  }, [channel, currentUser.id, onMarkRead])

  const broadcastTyping = useCallback((isTyping: boolean) => {
    channel?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: currentUser.id, name: currentUser.name, is_typing: isTyping },
    })
  }, [channel, currentUser.id, currentUser.name])

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    broadcastTyping(true)
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => broadcastTyping(false), 3000)
  }

  async function handleSend() {
    if (!text.trim() || !onSendMessage) return
    setSending(true)
    broadcastTyping(false)
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    try {
      await onSendMessage(text.trim(), 'text')
      setText('')
    } finally { setSending(false) }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !onSendMessage) return
    setFileError(null)
    if (file.size > MAX_IMAGE_BYTES) {
      setFileError('Image must be under 10 MB')
      return
    }
    setSending(true)
    try {
      await onSendMessage('', 'image', file)
    } finally {
      setSending(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-8">No messages yet. Start the conversation.</p>
        )}
        {messages.map(msg => {
          const isMine = msg.sender_id === currentUser.id
          const content = decrypted[msg.id]
          return (
            <div key={msg.id} className={`flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-medium text-gray-400">{msg.sender_name}</span>
                <span className="text-xs text-gray-600">{ROLE_LABELS[msg.sender_role]}</span>
                <span className="text-xs text-gray-600">{formatTime(msg.created_at)}</span>
              </div>
              <div className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-2 ${
                isMine ? 'bg-violet-600 text-white rounded-br-sm' : 'bg-gray-800 text-gray-100 rounded-bl-sm'
              }`}>
                {msg.message_type === 'image' && msg.attachment_url ? (
                  <img src={msg.attachment_url} alt="attachment" className="max-w-full rounded" />
                ) : (
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {content ?? <span className="opacity-50 italic">Decrypting…</span>}
                  </p>
                )}
              </div>
              {/* Read receipts */}
              {msg.reads.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">✓✓</span>
                  <span className="text-xs text-gray-600">
                    {msg.reads.map(r => r.reader_name || 'Read').join(', ')}
                  </span>
                </div>
              )}
            </div>
          )
        })}
        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-500 italic">
            <span className="flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-800 p-3 space-y-2">
        {fileError && <p className="text-xs text-red-400">{fileError}</p>}
        <div className="flex items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            className="p-2 text-gray-400 hover:text-gray-200 disabled:opacity-50 transition-colors flex-shrink-0"
            aria-label="Attach image"
            title="Attach image (max 10 MB)"
          >
            📎
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handleFileChange}
          />
          <textarea
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send)"
            rows={1}
            disabled={sending}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="p-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl transition-colors flex-shrink-0"
            aria-label="Send message"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  )
}
