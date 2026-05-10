'use client'
import { useEffect, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'

type DocCategory =
  | 'proof_of_funds'
  | 'government_id'
  | 'spa'
  | 'reservation_agreement'
  | 'contract_to_sell'
  | 'title_copy'
  | 'other'

interface Document {
  id: string
  file_name: string
  file_type: string
  file_size_bytes: number
  category: DocCategory
  uploaded_by: string
  uploader_name: string
  uploader_role: string
  created_at: string
  deleted_at: string | null
}

interface CurrentUser {
  id: string
  role: 'buyer' | 'seller' | 'realtor'
}

interface DocumentVaultProps {
  roomId: string
  currentUser: CurrentUser
  roomStatus: string
  documents: Document[]
  channel: RealtimeChannel | null
  onUpload?: (file: File, category: DocCategory) => Promise<void>
  onDownload?: (docId: string) => Promise<void>
  onDelete?: (docId: string) => Promise<void>
}

const CATEGORY_LABELS: Record<DocCategory, string> = {
  proof_of_funds: 'Proof of Funds',
  government_id: 'Government ID',
  spa: 'SPA',
  reservation_agreement: 'Reservation Agreement',
  contract_to_sell: 'Contract to Sell',
  title_copy: 'Title Copy',
  other: 'Other',
}

const CATEGORY_COLORS: Record<DocCategory, string> = {
  proof_of_funds: 'bg-green-900/50 text-green-400',
  government_id: 'bg-blue-900/50 text-blue-400',
  spa: 'bg-purple-900/50 text-purple-400',
  reservation_agreement: 'bg-yellow-900/50 text-yellow-400',
  contract_to_sell: 'bg-orange-900/50 text-orange-400',
  title_copy: 'bg-cyan-900/50 text-cyan-400',
  other: 'bg-gray-700 text-gray-400',
}

const MAX_FILE_BYTES = 25 * 1024 * 1024 // 25 MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { dateStyle: 'medium' })
}

export function DocumentVault({
  currentUser,
  roomStatus,
  documents: initialDocs,
  channel,
  onUpload,
  onDownload,
  onDelete,
}: DocumentVaultProps) {
  const [docs, setDocs] = useState<Document[]>(initialDocs.filter(d => !d.deleted_at))
  const [selectedCategory, setSelectedCategory] = useState<DocCategory>('other')
  const [uploading, setUploading] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  useEffect(() => {
    setDocs(initialDocs.filter(d => !d.deleted_at))
  }, [initialDocs])

  // Real-time document updates
  useEffect(() => {
    if (!channel) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    channel.on('postgres_changes' as any, { event: 'INSERT', schema: 'public', table: 'negotiation_documents' }, (payload: any) => {
      setDocs(prev => {
        if (prev.some(d => d.id === payload.new.id)) return prev
        return [...prev, payload.new]
      })
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    channel.on('postgres_changes' as any, { event: 'UPDATE', schema: 'public', table: 'negotiation_documents' }, (payload: any) => {
      if (payload.new.deleted_at) {
        setDocs(prev => prev.filter(d => d.id !== payload.new.id))
      }
    })
  }, [channel])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !onUpload) return
    setFileError(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError('Only PDF, JPEG, PNG, and DOCX files are allowed.')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError('File must be under 25 MB.')
      return
    }

    setUploading(true)
    try {
      await onUpload(file, selectedCategory)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleDownload(docId: string) {
    if (!onDownload) return
    setLoadingId(docId)
    try { await onDownload(docId) } finally { setLoadingId(null) }
  }

  async function handleDelete(docId: string) {
    if (!onDelete) return
    setLoadingId(docId)
    try { await onDelete(docId) } finally { setLoadingId(null) }
  }

  const canUpload = roomStatus === 'active'

  return (
    <div className="flex flex-col h-full">
      {/* Upload bar */}
      {canUpload && onUpload && (
        <div className="p-4 border-b border-gray-800 space-y-2">
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value as DocCategory)}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-violet-500"
            >
              {(Object.keys(CATEGORY_LABELS) as DocCategory[]).map(cat => (
                <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
              ))}
            </select>
            <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded border border-dashed text-sm cursor-pointer transition-colors ${
              uploading
                ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                : 'border-gray-600 text-gray-400 hover:border-violet-500 hover:text-violet-400'
            }`}>
              {uploading ? 'Uploading…' : '+ Upload Document'}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.docx"
                className="hidden"
                disabled={uploading}
                onChange={handleFileChange}
              />
            </label>
          </div>
          {fileError && <p className="text-xs text-red-400">{fileError}</p>}
        </div>
      )}

      {/* Document list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {docs.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-8">No documents uploaded yet.</p>
        )}
        {docs.map(doc => {
          const isUploader = doc.uploaded_by === currentUser.id
          const canDelete = isUploader && roomStatus === 'active'
          const isLoading = loadingId === doc.id

          return (
            <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
              <div className="text-2xl flex-shrink-0">
                {doc.file_type === 'pdf' ? '📄' : doc.file_type === 'docx' ? '📝' : '🖼️'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 truncate font-medium">{doc.file_name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${CATEGORY_COLORS[doc.category]}`}>
                    {CATEGORY_LABELS[doc.category]}
                  </span>
                  <span className="text-xs text-gray-500">{formatBytes(doc.file_size_bytes)}</span>
                  <span className="text-xs text-gray-500">by {doc.uploader_name}</span>
                  <span className="text-xs text-gray-600">{formatDate(doc.created_at)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {onDownload && (
                  <button
                    onClick={() => handleDownload(doc.id)}
                    disabled={isLoading}
                    className="p-1.5 text-gray-400 hover:text-violet-400 disabled:opacity-50 transition-colors"
                    aria-label="Download"
                    title="Download"
                  >
                    ⬇
                  </button>
                )}
                {canDelete && onDelete && (
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={isLoading}
                    className="p-1.5 text-gray-600 hover:text-red-400 disabled:opacity-50 transition-colors"
                    aria-label="Delete"
                    title="Delete"
                  >
                    🗑
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
