'use client'
import { useState } from 'react'
import { Navbar } from '@/components/Navbar'

const TOKENIZED = [
  {
    id: 'tok1',
    property: 'Condo Unit in BGC Taguig',
    totalShares: 100,
    pricePerShare: 15000,
    availableShares: 34,
    myShares: 5,
    monthlyRent: 28000,
    mgmtFee: 0.08,
    blockchain_id: '0xTOK001...abc',
    image: '🏙️',
  },
  {
    id: 'tok2',
    property: 'Beach House in Batangas',
    totalShares: 50,
    pricePerShare: 40000,
    availableShares: 12,
    myShares: 0,
    monthlyRent: 45000,
    mgmtFee: 0.08,
    blockchain_id: '0xTOK002...def',
    image: '🏖️',
  },
]

export default function TokensPage() {
  const [buyModal, setBuyModal] = useState<string | null>(null)
  const [shares, setShares] = useState(1)
  const [toast, setToast] = useState('')

  const token = TOKENIZED.find(t => t.id === buyModal)

  function buyShares() {
    setToast(`✅ ${shares} share(s) purchased! Recorded on Blockchain Vault.`)
    setBuyModal(null)
    setShares(1)
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

      <div style={{ maxWidth: 900, margin: '0 auto', paddingTop: 112, paddingBottom: 60, paddingLeft: 32, paddingRight: 32 }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(112,59,247,0.1)', border: '1px solid rgba(112,59,247,0.3)', borderRadius: 99, padding: '6px 14px', fontSize: 12, color: '#703BF7', marginBottom: 16 }}>
            ⛓️ Blockchain-Verified Fractional Ownership
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>Tokenized Properties</h1>
          <p style={{ fontSize: 15, color: '#595959', margin: '0 0 8px' }}>Own a fraction of premium properties. Earn proportional rental income every month.</p>
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#EF4444', display: 'inline-block' }}>
            ⚠️ SEC Risk Disclaimer: Tokenized property investments carry risk. Past returns do not guarantee future performance. This is not a registered securities offering.
          </div>
        </div>

        {/* My holdings summary */}
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 20, marginBottom: 28 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 14 }}>My Portfolio</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              { label: 'Total Shares Owned', value: TOKENIZED.reduce((s, t) => s + t.myShares, 0).toString(), color: '#703BF7' },
              { label: 'Portfolio Value', value: `₱${TOKENIZED.reduce((s, t) => s + t.myShares * t.pricePerShare, 0).toLocaleString()}`, color: '#10B981' },
              { label: 'Est. Monthly Income', value: `₱${TOKENIZED.reduce((s, t) => s + Math.floor(t.myShares / t.totalShares * t.monthlyRent * (1 - t.mgmtFee)), 0).toLocaleString()}`, color: '#F59E0B' },
            ].map(s => (
              <div key={s.label} style={{ background: '#141414', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: '#595959', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Token listings */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {TOKENIZED.map(t => {
            const myIncome = Math.floor(t.myShares / t.totalShares * t.monthlyRent * (1 - t.mgmtFee))
            const ownership = ((t.myShares / t.totalShares) * 100).toFixed(1)
            return (
              <div key={t.id} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, padding: 24 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{t.image}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{t.property}</div>
                <div style={{ fontSize: 12, color: '#595959', marginBottom: 16, fontFamily: 'monospace' }}>⛓️ {t.blockchain_id}</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {[
                    { label: 'Price/Share', value: `₱${t.pricePerShare.toLocaleString()}` },
                    { label: 'Available', value: `${t.availableShares}/${t.totalShares}` },
                    { label: 'Monthly Rent', value: `₱${t.monthlyRent.toLocaleString()}` },
                    { label: 'My Shares', value: `${t.myShares} (${ownership}%)` },
                  ].map(s => (
                    <div key={s.label} style={{ background: '#141414', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, color: '#595959', marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {t.myShares > 0 && (
                  <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#10B981' }}>
                    💰 Your est. monthly income: ₱{myIncome.toLocaleString()}
                  </div>
                )}

                {/* Share availability bar */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#595959', marginBottom: 4 }}>
                    <span>Shares sold</span>
                    <span>{t.totalShares - t.availableShares}/{t.totalShares}</span>
                  </div>
                  <div style={{ background: '#1A1A1A', borderRadius: 99, height: 6 }}>
                    <div style={{ width: `${((t.totalShares - t.availableShares) / t.totalShares) * 100}%`, height: '100%', background: '#703BF7', borderRadius: 99 }} />
                  </div>
                </div>

                <button
                  onClick={() => { setBuyModal(t.id); setShares(1) }}
                  disabled={t.availableShares === 0}
                  style={{ width: '100%', background: t.availableShares === 0 ? '#1A1A1A' : '#703BF7', color: t.availableShares === 0 ? '#595959' : '#fff', border: 'none', borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 600, cursor: t.availableShares === 0 ? 'not-allowed' : 'pointer', boxShadow: t.availableShares === 0 ? 'none' : '0 0 20px rgba(112,59,247,0.3)' }}
                >
                  {t.availableShares === 0 ? 'Fully Subscribed' : 'Buy Shares'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Buy modal */}
      {buyModal && token && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 16, padding: 32, width: '100%', maxWidth: 440 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>Buy Shares</h2>
            <p style={{ fontSize: 13, color: '#595959', margin: '0 0 20px' }}>{token.property}</p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: '#595959', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Number of Shares (max {token.availableShares})</label>
              <input
                type="number"
                min={1}
                max={token.availableShares}
                value={shares}
                onChange={e => setShares(Math.min(token.availableShares, Math.max(1, parseInt(e.target.value) || 1)))}
                style={{ width: '100%', background: '#141414', border: '1px solid #1A1A1A', borderRadius: 8, padding: '12px 14px', fontSize: 16, color: '#fff', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ background: '#141414', borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: '#595959' }}>Price per share</span>
                <span style={{ color: '#fff' }}>₱{token.pricePerShare.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: '#595959' }}>Shares</span>
                <span style={{ color: '#fff' }}>× {shares}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #1A1A1A', fontSize: 16, fontWeight: 800 }}>
                <span style={{ color: '#fff' }}>Total</span>
                <span style={{ color: '#703BF7' }}>₱{(shares * token.pricePerShare).toLocaleString()}</span>
              </div>
            </div>

            <div style={{ fontSize: 12, color: '#595959', marginBottom: 20 }}>
              Est. monthly income: ₱{Math.floor(shares / token.totalShares * token.monthlyRent * (1 - token.mgmtFee)).toLocaleString()} after {(token.mgmtFee * 100)}% management fee
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setBuyModal(null)} style={{ background: 'transparent', color: '#595959', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button onClick={buyShares} style={{ background: '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Confirm Purchase</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
