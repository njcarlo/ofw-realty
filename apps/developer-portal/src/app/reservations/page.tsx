'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DeveloperSidebar } from '@/components/DeveloperSidebar'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B', confirmed: '#10B981', rejected: '#EF4444', expired: '#595959',
}

function ExpiryCountdown({ expiresAt }: { expiresAt: string }) {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return <span style={{ fontSize: 12, color: '#595959' }}>Expired</span>
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  const urgent = hours < 6
  return (
    <span style={{ fontSize: 12, color: urgent ? '#EF4444' : '#F59E0B', fontWeight: 600 }}>
      {hours}h {mins}m left
    </span>
  )
}

export default function ReservationsPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [acting, setActing] = useState<string | null>(null)
  const [rejectModal, setRejectModal] = useState<{ id: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [commissionModal, setCommissionModal] = useState<any | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const t = data.session?.access_token
      if (!t) { router.replace('/onboarding'); return }
      setToken(t)
      const res = await fetch(`${API}/api/reservations`, { headers: { Authorization: `Bearer ${t}` } })
      if (res.ok) setReservations(await res.json())
      setLoading(false)
    })
  }, [router])

  async function handleConfirm(id: string) {
    if (!token) return
    setActing(id)
    const res = await fetch(`${API}/api/reservations/${id}/confirm`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setReservations(r => r.map(rv => rv.id === id ? { ...rv, status: 'confirmed' } : rv))
      setCommissionModal(data.commission_record)
    }
    setActing(null)
  }

  async function handleReject() {
    if (!token || !rejectModal) return
    setActing(rejectModal.id)
    await fetch(`${API}/api/reservations/${rejectModal.id}/reject`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ rejection_reason: rejectReason }),
    })
    setReservations(r => r.map(rv => rv.id === rejectModal.id ? { ...rv, status: 'rejected' } : rv))
    setRejectModal(null)
    setRejectReason('')
    setActing(null)
  }

  const filtered = statusFilter ? reservations.filter(r => r.status === statusFilter) : reservations

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <DeveloperSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Reservations</h1>
          <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>All reservation requests across your projects</p>
        </div>

        {/* Status filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['', 'pending', 'confirmed', 'rejected', 'expired'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                background: statusFilter === s ? 'rgba(112,59,247,0.15)' : '#0D0D0D',
                color: statusFilter === s ? '#703BF7' : '#595959',
                border: `1px solid ${statusFilter === s ? 'rgba(112,59,247,0.3)' : '#1A1A1A'}`,
                borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer', textTransform: 'capitalize',
              }}
            >
              {s || 'All'} {s && `(${reservations.filter(r => r.status === s).length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ color: '#595959', fontSize: 14 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 40, textAlign: 'center', color: '#595959', fontSize: 14 }}>
            No reservations found.
          </div>
        ) : (
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 100px 120px', padding: '10px 20px', borderBottom: '1px solid #141414' }}>
              {['Unit', 'Broker', 'Buyer', 'Expiry', 'Status', 'Actions'].map(h => (
                <div key={h} style={{ fontSize: 11, color: '#595959', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
              ))}
            </div>
            {filtered.map((r: any, i: number) => (
              <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 100px 120px', padding: '16px 20px', borderBottom: i < filtered.length - 1 ? '1px solid #141414' : 'none', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{r.unit_identifier ?? r.unit_id}</div>
                  <div style={{ fontSize: 12, color: '#595959' }}>{r.project_name}</div>
                </div>
                <div style={{ fontSize: 13, color: '#999' }}>{r.broker_name ?? '—'}</div>
                <div>
                  <div style={{ fontSize: 13, color: '#fff' }}>{r.buyer_name}</div>
                  <div style={{ fontSize: 12, color: '#595959' }}>{r.buyer_contact}</div>
                </div>
                <div>
                  {r.status === 'pending' && r.expires_at ? (
                    <ExpiryCountdown expiresAt={r.expires_at} />
                  ) : (
                    <span style={{ fontSize: 12, color: '#595959' }}>{r.expires_at ? new Date(r.expires_at).toLocaleDateString() : '—'}</span>
                  )}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: `${STATUS_COLORS[r.status] ?? '#595959'}15`, color: STATUS_COLORS[r.status] ?? '#595959', textTransform: 'capitalize', display: 'inline-block' }}>
                  {r.status}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {r.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleConfirm(r.id)} disabled={acting === r.id}
                        style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setRejectModal({ id: r.id })} disabled={acting === r.id}
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reject modal */}
        {rejectModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 16, padding: 32, maxWidth: 440, width: '100%' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Reject Reservation</h2>
              <p style={{ fontSize: 14, color: '#595959', marginBottom: 20 }}>Please provide a reason for rejection. The unit will revert to available.</p>
              <textarea
                rows={4} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Buyer did not meet requirements…"
                style={{ width: '100%', background: '#141414', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#fff', resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 20 }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setRejectModal(null); setRejectReason('') }} style={{ flex: 1, background: '#141414', color: '#999', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px', fontSize: 14, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleReject} disabled={!rejectReason.trim()} style={{ flex: 1, background: rejectReason.trim() ? 'rgba(239,68,68,0.15)' : '#333', color: rejectReason.trim() ? '#EF4444' : '#595959', border: `1px solid ${rejectReason.trim() ? 'rgba(239,68,68,0.3)' : '#1A1A1A'}`, borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 600, cursor: rejectReason.trim() ? 'pointer' : 'not-allowed' }}>
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Commission record modal */}
        {commissionModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ background: '#0D0D0D', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16, padding: 32, maxWidth: 400, width: '100%' }}>
              <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 16 }}>✅</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8, textAlign: 'center' }}>Reservation Confirmed</h2>
              <p style={{ fontSize: 14, color: '#595959', marginBottom: 20, textAlign: 'center' }}>Commission record created:</p>
              <div style={{ background: '#141414', borderRadius: 10, padding: 16, marginBottom: 20 }}>
                {[
                  { label: 'Unit Price', value: `₱${Number(commissionModal.unit_price_php ?? 0).toLocaleString()}` },
                  { label: 'Rate', value: `${commissionModal.rate_value}${commissionModal.rate_type === 'percentage' ? '%' : ' PHP'}` },
                  { label: 'Gross Commission', value: `₱${Number(commissionModal.gross_commission ?? 0).toLocaleString()}` },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, color: '#595959' }}>{s.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{s.value}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setCommissionModal(null)} style={{ width: '100%', background: '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Done
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
