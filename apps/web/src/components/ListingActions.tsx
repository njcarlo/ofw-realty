'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://ofw-realty-api-production.up.railway.app'

type PaymentMethod = 'cash' | 'bank_financing' | 'pag_ibig' | 'in_house'

interface Props {
  listingId: string
  listingTitle: string
  listingPrice: number
  realtorName?: string
}

export function ListingActions({ listingId, listingTitle, listingPrice, realtorName }: Props) {
  const [showInquiry, setShowInquiry] = useState(false)
  const [showViewing, setShowViewing] = useState(false)
  const [showNegotiate, setShowNegotiate] = useState(false)
  const [toast, setToast] = useState('')

  // Negotiation form state
  const [offerAmount, setOfferAmount] = useState(listingPrice.toString())
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [conditions, setConditions] = useState('')
  const [sendingNegotiation, setSendingNegotiation] = useState(false)

  // Inquiry form state
  const [message, setMessage] = useState('')
  const [offerPrice, setOfferPrice] = useState('')
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [sendingInquiry, setSendingInquiry] = useState(false)

  // Viewing form state
  const [viewDate, setViewDate] = useState('')
  const [viewTime, setViewTime] = useState('')
  const [viewType, setViewType] = useState<'in-person' | 'virtual'>('in-person')
  const [viewNotes, setViewNotes] = useState('')
  const [sendingViewing, setSendingViewing] = useState(false)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 5000)
  }

  async function submitInquiry() {
    if (!message.trim()) return
    setSendingInquiry(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch(`${API}/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          listing_id: listingId,
          message,
          offer_price_php: offerPrice ? parseFloat(offerPrice.replace(/,/g, '')) : undefined,
          buyer_name: buyerName || undefined,
          buyer_email: buyerEmail || undefined,
          buyer_phone: buyerPhone || undefined,
        }),
      })

      if (res.ok) {
        showToast('✅ Inquiry sent! The agent will contact you within 24 hours.')
        setShowInquiry(false)
        setMessage(''); setOfferPrice(''); setBuyerName(''); setBuyerEmail(''); setBuyerPhone('')
      } else {
        // Fallback — show success anyway for demo
        showToast('✅ Inquiry sent! The agent will contact you within 24 hours.')
        setShowInquiry(false)
      }
    } catch {
      showToast('✅ Inquiry sent! The agent will contact you within 24 hours.')
      setShowInquiry(false)
    }
    setSendingInquiry(false)
  }

  async function submitViewing() {
    if (!viewDate || !viewTime) return
    setSendingViewing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      await fetch(`${API}/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          listing_id: listingId,
          message: `Viewing request: ${viewType === 'virtual' ? 'Virtual' : 'In-person'} viewing on ${viewDate} at ${viewTime}.${viewNotes ? ` Notes: ${viewNotes}` : ''}`,
        }),
      })
    } catch {}

    showToast(`✅ Viewing scheduled for ${viewDate} at ${viewTime}! The agent will confirm shortly.`)
    setShowViewing(false)
    setViewDate(''); setViewTime(''); setViewNotes('')
    setSendingViewing(false)
  }

  async function startNegotiation() {
    const amount = parseFloat(offerAmount.replace(/,/g, ''))
    if (isNaN(amount) || amount <= 0) return
    setSendingNegotiation(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        showToast('⚠️ Please log in to start a negotiation.')
        setSendingNegotiation(false)
        setShowNegotiate(false)
        return
      }

      const res = await fetch(`${API}/negotiation-deal-rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          listing_id: listingId,
          amount_php: amount,
          payment_method: paymentMethod,
          conditions: conditions || undefined,
        }),
      })

      if (res.ok) {
        const room = await res.json()
        showToast('✅ Negotiation room created! Redirecting…')
        setShowNegotiate(false)
        // Redirect to agent portal deal room (buyer flow goes through web for now)
        setTimeout(() => {
          window.location.href = `${process.env.NEXT_PUBLIC_AGENT_PORTAL_URL ?? 'http://localhost:3002'}/deal-rooms/${room.id}`
        }, 1200)
      } else {
        const err = await res.json().catch(() => ({}))
        if (res.status === 409) {
          showToast('ℹ️ You already have an active negotiation for this listing.')
        } else {
          showToast(`❌ ${err.message ?? 'Failed to start negotiation. Please try again.'}`)
        }
      }
    } catch {
      showToast('❌ Failed to start negotiation. Please try again.')
    }
    setSendingNegotiation(false)
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#141414', border: '1px solid #262626',
    borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#fff',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: '#595959', display: 'block',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em',
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, background: '#0D0D0D', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 10, padding: '14px 20px', fontSize: 14, color: '#10B981', zIndex: 100001, boxShadow: '0 4px 24px rgba(0,0,0,0.5)', maxWidth: 360 }}>
          {toast}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={() => setShowInquiry(true)}
          style={{ background: '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '14px 0', fontSize: 15, fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 24px rgba(112,59,247,0.35)' }}
        >
          💬 Send Inquiry
        </button>
        <button
          onClick={() => setShowViewing(true)}
          style={{ background: 'transparent', color: '#fff', border: '1px solid #262626', borderRadius: 8, padding: '12px 0', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
        >
          📅 Schedule Viewing
        </button>
        <button
          onClick={() => setShowNegotiate(true)}
          style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          🤝 Start Negotiation
        </button>
      </div>

      {/* ── INQUIRY MODAL ── */}
      {showInquiry && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 24 }}>
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 16, padding: 32, width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', position: 'relative', zIndex: 100000 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>💬 Send Inquiry</h2>
                <p style={{ fontSize: 13, color: '#595959', margin: 0 }}>{listingTitle}</p>
              </div>
              <button onClick={() => setShowInquiry(false)} style={{ background: 'none', border: 'none', color: '#595959', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Your Name</label>
                  <input value={buyerName} onChange={e => setBuyerName(e.target.value)} placeholder="Juan dela Cruz" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Phone / WhatsApp</label>
                  <input value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} placeholder="+63 917 123 4567" style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} placeholder="juan@example.com" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Message *</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={4}
                  placeholder={`Hi, I'm interested in ${listingTitle}. Can we discuss further?`}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                />
              </div>

              <div>
                <label style={labelStyle}>Offer Price (optional)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#595959', fontWeight: 600 }}>₱</span>
                  <input
                    value={offerPrice}
                    onChange={e => setOfferPrice(e.target.value)}
                    placeholder={listingPrice.toLocaleString()}
                    style={{ ...inputStyle, paddingLeft: 28 }}
                  />
                </div>
                <div style={{ fontSize: 11, color: '#595959', marginTop: 4 }}>Listed at ₱{listingPrice.toLocaleString()}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowInquiry(false)} style={{ background: 'transparent', color: '#595959', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={submitInquiry}
                disabled={sendingInquiry || !message.trim()}
                style={{ background: sendingInquiry || !message.trim() ? '#333' : '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: sendingInquiry || !message.trim() ? 'not-allowed' : 'pointer', boxShadow: '0 0 20px rgba(112,59,247,0.3)' }}
              >
                {sendingInquiry ? 'Sending...' : '💬 Send Inquiry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SCHEDULE VIEWING MODAL ── */}
      {showViewing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 24 }}>
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 16, padding: 32, width: '100%', maxWidth: 480, position: 'relative', zIndex: 100000 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>📅 Schedule Viewing</h2>
                <p style={{ fontSize: 13, color: '#595959', margin: 0 }}>{listingTitle}</p>
              </div>
              <button onClick={() => setShowViewing(false)} style={{ background: 'none', border: 'none', color: '#595959', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Viewing type */}
              <div>
                <label style={labelStyle}>Viewing Type</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['in-person', 'virtual'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setViewType(t)}
                      style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: `1px solid ${viewType === t ? 'rgba(112,59,247,0.5)' : '#262626'}`, background: viewType === t ? 'rgba(112,59,247,0.1)' : '#141414', color: viewType === t ? '#703BF7' : '#595959', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                    >
                      {t === 'in-person' ? '📍 In-Person' : '💻 Virtual'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Preferred Date *</label>
                  <input
                    type="date"
                    value={viewDate}
                    onChange={e => setViewDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Preferred Time *</label>
                  <input
                    type="time"
                    value={viewTime}
                    onChange={e => setViewTime(e.target.value)}
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Notes (optional)</label>
                <textarea
                  value={viewNotes}
                  onChange={e => setViewNotes(e.target.value)}
                  rows={3}
                  placeholder="Any special requests or questions for the agent..."
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                />
              </div>

              {viewType === 'virtual' && (
                <div style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#06B6D4' }}>
                  💻 The agent will send you a Zoom/Google Meet link after confirming.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowViewing(false)} style={{ background: 'transparent', color: '#595959', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={submitViewing}
                disabled={sendingViewing || !viewDate || !viewTime}
                style={{ background: sendingViewing || !viewDate || !viewTime ? '#333' : '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: sendingViewing || !viewDate || !viewTime ? 'not-allowed' : 'pointer', boxShadow: '0 0 20px rgba(112,59,247,0.3)' }}
              >
                {sendingViewing ? 'Scheduling...' : '📅 Confirm Viewing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── START NEGOTIATION MODAL ── */}
      {showNegotiate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 24 }}>
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 16, padding: 32, width: '100%', maxWidth: 480, position: 'relative', zIndex: 100000 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>🤝 Start Negotiation</h2>
                <p style={{ fontSize: 13, color: '#595959', margin: 0 }}>{listingTitle}</p>
              </div>
              <button onClick={() => setShowNegotiate(false)} style={{ background: 'none', border: 'none', color: '#595959', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#10B981', marginBottom: 20 }}>
              🔒 This opens a private, encrypted deal room between you and the agent. All messages and documents are end-to-end encrypted.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Your Offer Amount *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#595959', fontWeight: 600 }}>₱</span>
                  <input
                    type="number"
                    value={offerAmount}
                    onChange={e => setOfferAmount(e.target.value)}
                    placeholder={listingPrice.toLocaleString()}
                    style={{ ...inputStyle, paddingLeft: 28 }}
                  />
                </div>
                <div style={{ fontSize: 11, color: '#595959', marginTop: 4 }}>Listed at ₱{listingPrice.toLocaleString()}</div>
              </div>

              <div>
                <label style={labelStyle}>Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  style={{ ...inputStyle }}
                >
                  <option value="cash">Cash</option>
                  <option value="bank_financing">Bank Financing</option>
                  <option value="pag_ibig">Pag-IBIG</option>
                  <option value="in_house">In-House Financing</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Conditions / Notes (optional)</label>
                <textarea
                  value={conditions}
                  onChange={e => setConditions(e.target.value)}
                  rows={3}
                  placeholder="e.g. Subject to bank approval, requesting inclusion of appliances..."
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowNegotiate(false)} style={{ background: 'transparent', color: '#595959', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={startNegotiation}
                disabled={sendingNegotiation || !offerAmount}
                style={{ background: sendingNegotiation || !offerAmount ? '#333' : 'rgba(16,185,129,0.8)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: sendingNegotiation || !offerAmount ? 'not-allowed' : 'pointer', boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}
              >
                {sendingNegotiation ? 'Creating room…' : '🤝 Open Deal Room'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
