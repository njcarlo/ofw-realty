'use client'
import { useState } from 'react'
import { Navbar } from '@/components/Navbar'

const MILESTONES = [
  { id: 1, label: 'Contract Initiation', percent: 50, description: 'Funds locked on contract signing', status: 'released', releasedAt: 'Apr 1, 2026' },
  { id: 2, label: 'CTS Upload Verified', percent: 50, description: 'Released on verified Contract to Sell upload', status: 'pending', releasedAt: null },
]

const ESCROW = {
  id: 'ESC-2026-0042',
  property: 'House & Lot in Bacoor Cavite',
  totalAmount: 4500000,
  currency: 'PHP',
  buyer: 'Jose Dela Cruz',
  seller: 'Maria Santos',
  status: 'active',
  createdAt: 'Apr 1, 2026',
  blockchain_tx: '0xabc123...def456',
}

export default function EscrowPage() {
  const [releasing, setReleasing] = useState(false)
  const [toast, setToast] = useState('')

  const released = MILESTONES.filter(m => m.status === 'released')
  const pending = MILESTONES.filter(m => m.status === 'pending')
  const releasedAmount = released.reduce((sum, m) => sum + (ESCROW.totalAmount * m.percent / 100), 0)
  const pendingAmount = pending.reduce((sum, m) => sum + (ESCROW.totalAmount * m.percent / 100), 0)

  async function releaseMilestone(id: number) {
    setReleasing(true)
    await new Promise(r => setTimeout(r, 2000))
    setReleasing(false)
    setToast('✅ Milestone 2 released! Funds transferred to seller.')
    setTimeout(() => setToast(''), 5000)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <Navbar />
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, background: '#0D0D0D', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 10, padding: '14px 20px', fontSize: 14, color: '#10B981', zIndex: 9999 }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth: 800, margin: '0 auto', paddingTop: 112, paddingBottom: 60, paddingLeft: 32, paddingRight: 32 }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(112,59,247,0.1)', border: '1px solid rgba(112,59,247,0.3)', borderRadius: 99, padding: '6px 14px', fontSize: 12, color: '#703BF7', marginBottom: 16 }}>
            ⛓️ Blockchain Smart Contract Escrow
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>Escrow Contract</h1>
          <p style={{ fontSize: 14, color: '#595959', margin: 0 }}>Funds are locked in a blockchain smart contract and released automatically when milestone conditions are met.</p>
        </div>

        {/* Contract summary */}
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 13, color: '#595959', marginBottom: 4 }}>Contract ID</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{ESCROW.id}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 99, background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>● Active</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
            {[
              { label: 'Total Locked', value: `₱${ESCROW.totalAmount.toLocaleString()}`, color: '#703BF7' },
              { label: 'Released', value: `₱${releasedAmount.toLocaleString()}`, color: '#10B981' },
              { label: 'Pending Release', value: `₱${pendingAmount.toLocaleString()}`, color: '#F59E0B' },
            ].map(s => (
              <div key={s.label} style={{ background: '#141414', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: '#595959', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
            <div style={{ color: '#595959' }}>🏡 Property: <span style={{ color: '#fff' }}>{ESCROW.property}</span></div>
            <div style={{ color: '#595959' }}>👤 Buyer: <span style={{ color: '#fff' }}>{ESCROW.buyer}</span></div>
            <div style={{ color: '#595959' }}>🏢 Seller: <span style={{ color: '#fff' }}>{ESCROW.seller}</span></div>
            <div style={{ color: '#595959' }}>📅 Created: <span style={{ color: '#fff' }}>{ESCROW.createdAt}</span></div>
          </div>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #141414', fontSize: 12, color: '#595959' }}>
            ⛓️ Blockchain TX: <span style={{ color: '#703BF7', fontFamily: 'monospace' }}>{ESCROW.blockchain_tx}</span>
          </div>
        </div>

        {/* Milestones */}
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 14 }}>Milestone Schedule</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {MILESTONES.map((m, i) => (
            <div key={m.id} style={{ background: '#0D0D0D', border: `1px solid ${m.status === 'released' ? 'rgba(16,185,129,0.3)' : '#1A1A1A'}`, borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 99, background: m.status === 'released' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {m.status === 'released' ? '✅' : '⏳'}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                      Milestone {m.id}: {m.label}
                    </div>
                    <div style={{ fontSize: 13, color: '#595959' }}>{m.description}</div>
                    {m.releasedAt && <div style={{ fontSize: 12, color: '#10B981', marginTop: 4 }}>Released: {m.releasedAt}</div>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: m.status === 'released' ? '#10B981' : '#F59E0B' }}>
                    ₱{(ESCROW.totalAmount * m.percent / 100).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: '#595959' }}>{m.percent}% of total</div>
                </div>
              </div>
              {m.status === 'pending' && (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #141414', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ flex: 1, fontSize: 13, color: '#595959' }}>
                    Waiting for: CTS document upload and admin verification
                  </div>
                  <button
                    onClick={() => releaseMilestone(m.id)}
                    disabled={releasing}
                    style={{ background: releasing ? '#333' : '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: releasing ? 'not-allowed' : 'pointer' }}
                  >
                    {releasing ? 'Processing...' : '⚡ Release Funds'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, padding: 16, background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 10, fontSize: 12, color: '#595959' }}>
          ⚠️ Smart contract escrow is powered by Hyperledger Fabric. Fund releases are irreversible once confirmed on-chain. For disputes, contact Admin.
        </div>
      </div>
    </div>
  )
}
