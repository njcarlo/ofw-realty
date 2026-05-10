'use client'
import { useState } from 'react'

type PaymentMethod = 'cash' | 'bank_financing' | 'pag_ibig' | 'in_house'
type OfferType = 'offer' | 'counter_offer'
type OfferResponse = 'accepted' | 'declined' | 'countered' | null

interface Offer {
  id: string
  offer_type: OfferType
  submitted_by: string
  submitter_role: 'buyer' | 'seller' | 'realtor'
  submitter_name: string
  amount_php: number
  payment_method: PaymentMethod | null
  conditions: string | null
  response: OfferResponse
  created_at: string
}

interface CurrentUser {
  id: string
  role: 'buyer' | 'seller' | 'realtor'
}

interface OfferThreadProps {
  roomId: string
  currentUser: CurrentUser
  roomStatus: string
  offers: Offer[]
  onAccept?: (offerId: string) => Promise<void>
  onDecline?: (offerId: string) => Promise<void>
  onCounter?: (offerId: string, amount: number, conditions: string) => Promise<void>
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  bank_financing: 'Bank Financing',
  pag_ibig: 'Pag-IBIG',
  in_house: 'In-House',
}

function formatPHP(amount: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(amount)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
}

export function OfferThread({
  currentUser,
  roomStatus,
  offers,
  onAccept,
  onDecline,
  onCounter,
}: OfferThreadProps) {
  const [counteringId, setCounteringId] = useState<string | null>(null)
  const [counterAmount, setCounterAmount] = useState('')
  const [counterConditions, setCounterConditions] = useState('')
  const [loading, setLoading] = useState(false)

  const isLocked = roomStatus !== 'active'
  const lastOffer = offers[offers.length - 1]

  // Determine if current user can act on the last offer
  const canAct = !isLocked && lastOffer && !lastOffer.response && (
    (lastOffer.submitter_role === 'buyer' && (currentUser.role === 'seller' || currentUser.role === 'realtor')) ||
    (lastOffer.submitter_role !== 'buyer' && currentUser.role === 'buyer')
  )

  async function handleAccept(offerId: string) {
    if (!onAccept) return
    setLoading(true)
    try { await onAccept(offerId) } finally { setLoading(false) }
  }

  async function handleDecline(offerId: string) {
    if (!onDecline) return
    setLoading(true)
    try { await onDecline(offerId) } finally { setLoading(false) }
  }

  async function handleCounter(offerId: string) {
    if (!onCounter) return
    const amount = parseFloat(counterAmount.replace(/,/g, ''))
    if (isNaN(amount) || amount <= 0) return
    setLoading(true)
    try {
      await onCounter(offerId, amount, counterConditions)
      setCounteringId(null)
      setCounterAmount('')
      setCounterConditions('')
    } finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {offers.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-8">No offers yet.</p>
        )}
        {offers.map(offer => (
          <div
            key={offer.id}
            className={`rounded-lg border p-4 space-y-2 ${
              offer.offer_type === 'offer'
                ? 'border-violet-700/40 bg-violet-900/10'
                : 'border-blue-700/40 bg-blue-900/10'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {offer.offer_type === 'offer' ? 'Offer' : 'Counter-Offer'}
                </span>
                <span className="text-xs text-gray-500 ml-2">by {offer.submitter_name} ({offer.submitter_role})</span>
              </div>
              <span className="text-xs text-gray-500 flex-shrink-0">{formatDate(offer.created_at)}</span>
            </div>

            <p className="text-xl font-bold text-white">{formatPHP(offer.amount_php)}</p>

            {offer.payment_method && (
              <p className="text-xs text-gray-400">Payment: {PAYMENT_LABELS[offer.payment_method]}</p>
            )}
            {offer.conditions && (
              <p className="text-xs text-gray-400 italic">"{offer.conditions}"</p>
            )}

            {offer.response && (
              <span className={`inline-block text-xs px-2 py-0.5 rounded font-medium ${
                offer.response === 'accepted' ? 'bg-green-900/50 text-green-400'
                : offer.response === 'declined' ? 'bg-red-900/50 text-red-400'
                : 'bg-gray-700 text-gray-400'
              }`}>
                {offer.response.charAt(0).toUpperCase() + offer.response.slice(1)}
              </span>
            )}

            {canAct && offer.id === lastOffer.id && !offer.response && (
              <div className="pt-2 space-y-2">
                {counteringId === offer.id ? (
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder="Counter amount (PHP)"
                      value={counterAmount}
                      onChange={e => setCounterAmount(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                    />
                    <textarea
                      placeholder="Conditions (optional)"
                      value={counterConditions}
                      onChange={e => setCounterConditions(e.target.value)}
                      rows={2}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCounter(offer.id)}
                        disabled={loading}
                        className="flex-1 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm rounded transition-colors"
                      >
                        Submit Counter
                      </button>
                      <button
                        onClick={() => setCounteringId(null)}
                        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(offer.id)}
                      disabled={loading}
                      className="flex-1 py-1.5 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm rounded transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDecline(offer.id)}
                      disabled={loading}
                      className="flex-1 py-1.5 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white text-sm rounded transition-colors"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => setCounteringId(offer.id)}
                      disabled={loading}
                      className="flex-1 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-200 text-sm rounded transition-colors"
                    >
                      Counter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {isLocked && (
        <div className="px-4 py-3 border-t border-gray-800 text-center text-xs text-gray-500">
          Offer thread is locked — {roomStatus.replace('_', ' ')}
        </div>
      )}
    </div>
  )
}
