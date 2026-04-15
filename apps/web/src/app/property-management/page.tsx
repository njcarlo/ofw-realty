'use client'
import { useState } from 'react'
import { Navbar } from '@/components/Navbar'

const UNITS = [
  {
    id: 'u1',
    property: 'House & Lot in Bacoor Cavite',
    tenant: 'Roberto Lim',
    rent: 18000,
    status: 'paid',
    dueDate: 'Apr 5, 2026',
    paidDate: 'Apr 3, 2026',
    tickets: [
      { id: 't1', issue: 'Leaking faucet in kitchen', category: 'Plumbing', status: 'resolved', date: 'Apr 8, 2026' },
    ],
  },
  {
    id: 'u2',
    property: 'Condo Unit in Cebu IT Park',
    tenant: 'Ana Reyes',
    rent: 22000,
    status: 'pending',
    dueDate: 'Apr 5, 2026',
    paidDate: null,
    tickets: [
      { id: 't2', issue: 'AC unit not cooling', category: 'Electrical', status: 'in_progress', date: 'Apr 10, 2026' },
      { id: 't3', issue: 'Bathroom door hinge broken', category: 'Carpentry', status: 'open', date: 'Apr 12, 2026' },
    ],
  },
]

const MGMT_FEE_RATE = 0.08 // 8%

export default function PropertyManagementPage() {
  const [activeUnit, setActiveUnit] = useState(UNITS[0].id)
  const [tab, setTab] = useState<'payments' | 'tickets' | 'roi'>('payments')

  const unit = UNITS.find(u => u.id === activeUnit)!
  const totalRent = UNITS.reduce((s, u) => s + u.rent, 0)
  const mgmtFee = totalRent * MGMT_FEE_RATE
  const netIncome = totalRent - mgmtFee

  const ticketStatusColor: Record<string, string> = {
    open: '#F59E0B',
    in_progress: '#06B6D4',
    resolved: '#10B981',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <Navbar />
      <div style={{ maxWidth: 1000, margin: '0 auto', paddingTop: 112, paddingBottom: 60, paddingLeft: 32, paddingRight: 32 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>Property Management</h1>
          <p style={{ fontSize: 14, color: '#595959', margin: 0 }}>Manage your rental units, track payments, and handle maintenance tickets.</p>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total Rent (Apr)', value: `₱${totalRent.toLocaleString()}`, color: '#703BF7', icon: '💰' },
            { label: 'Management Fee', value: `₱${mgmtFee.toLocaleString()}`, color: '#F59E0B', icon: '🏢' },
            { label: 'Net Income', value: `₱${netIncome.toLocaleString()}`, color: '#10B981', icon: '📈' },
            { label: 'Open Tickets', value: UNITS.flatMap(u => u.tickets).filter(t => t.status !== 'resolved').length.toString(), color: '#EF4444', icon: '🔧' },
          ].map(s => (
            <div key={s.label} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: '18px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#595959' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24 }}>
          {/* Unit list */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#595959', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Units</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {UNITS.map(u => (
                <div
                  key={u.id}
                  onClick={() => setActiveUnit(u.id)}
                  style={{ background: activeUnit === u.id ? 'rgba(112,59,247,0.1)' : '#0D0D0D', border: `1px solid ${activeUnit === u.id ? 'rgba(112,59,247,0.4)' : '#1A1A1A'}`, borderRadius: 10, padding: '14px 16px', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{u.property}</div>
                  <div style={{ fontSize: 12, color: '#595959', marginBottom: 6 }}>Tenant: {u.tenant}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#703BF7' }}>₱{u.rent.toLocaleString()}/mo</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: u.status === 'paid' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: u.status === 'paid' ? '#10B981' : '#F59E0B', textTransform: 'capitalize' }}>
                      {u.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail panel */}
          <div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 10, padding: 4, width: 'fit-content' }}>
              {(['payments', 'tickets', 'roi'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? '#703BF7' : 'transparent', color: tab === t ? '#fff' : '#595959', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>
                  {t === 'payments' ? '💳 Payments' : t === 'tickets' ? '🔧 Tickets' : '📊 ROI'}
                </button>
              ))}
            </div>

            {tab === 'payments' && (
              <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 24 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>{unit.property}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                  {[
                    { label: 'Monthly Rent', value: `₱${unit.rent.toLocaleString()}` },
                    { label: 'Due Date', value: unit.dueDate },
                    { label: 'Status', value: unit.status === 'paid' ? '✅ Paid' : '⏳ Pending' },
                    { label: 'Paid On', value: unit.paidDate ?? '—' },
                  ].map(s => (
                    <div key={s.label} style={{ background: '#141414', borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, color: '#595959', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                {unit.status === 'pending' && (
                  <button style={{ background: '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 20px rgba(112,59,247,0.3)' }}>
                    💳 Send Payment Reminder
                  </button>
                )}
              </div>
            )}

            {tab === 'tickets' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {unit.tickets.length === 0 ? (
                  <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 32, textAlign: 'center', color: '#595959' }}>No maintenance tickets</div>
                ) : unit.tickets.map(t => (
                  <div key={t.id} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{t.issue}</div>
                        <div style={{ fontSize: 12, color: '#595959' }}>Category: {t.category} · {t.date}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: `${ticketStatusColor[t.status]}22`, color: ticketStatusColor[t.status], textTransform: 'capitalize' }}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>
                    {t.status !== 'resolved' && (
                      <button style={{ background: 'transparent', color: '#703BF7', border: '1px solid rgba(112,59,247,0.3)', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer', marginTop: 8 }}>
                        Update Status
                      </button>
                    )}
                  </div>
                ))}
                <button style={{ background: '#0D0D0D', color: '#703BF7', border: '1px solid rgba(112,59,247,0.3)', borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  + New Ticket
                </button>
              </div>
            )}

            {tab === 'roi' && (
              <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 24 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 20 }}>April 2026 — Income Statement</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {[
                    { label: 'Gross Rent Collected', value: `₱${totalRent.toLocaleString()}`, color: '#10B981' },
                    { label: 'Management Fee (8%)', value: `-₱${mgmtFee.toLocaleString()}`, color: '#EF4444' },
                    { label: 'Maintenance Costs', value: '-₱2,500', color: '#EF4444' },
                    { label: 'Net Income', value: `₱${(netIncome - 2500).toLocaleString()}`, color: '#703BF7', bold: true },
                  ].map(s => (
                    <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #141414' }}>
                      <span style={{ fontSize: 14, color: '#999' }}>{s.label}</span>
                      <span style={{ fontSize: 14, fontWeight: (s as any).bold ? 800 : 600, color: s.color }}>{s.value}</span>
                    </div>
                  ))}
                </div>
                <button style={{ background: '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 20px rgba(112,59,247,0.3)' }}>
                  📄 Download Income Statement PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
