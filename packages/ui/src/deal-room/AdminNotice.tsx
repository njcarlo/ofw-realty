'use client'
import { useEffect } from 'react'

interface AdminNoticeProps {
  visible: boolean
  onDismiss: () => void
}

export function AdminNotice({ visible, onDismiss }: AdminNoticeProps) {
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(onDismiss, 30_000)
    return () => clearTimeout(timer)
  }, [visible, onDismiss])

  if (!visible) return null

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-300 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-amber-400">⚠</span>
        <span>An admin has entered this room for compliance or dispute resolution purposes.</span>
      </div>
      <button
        onClick={onDismiss}
        className="text-amber-400 hover:text-amber-200 transition-colors flex-shrink-0"
        aria-label="Dismiss admin notice"
      >
        ✕
      </button>
    </div>
  )
}
