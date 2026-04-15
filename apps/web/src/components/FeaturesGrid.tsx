'use client'
import { useState } from 'react'

const FEATURES = [
  { icon: '🔐', title: 'Blockchain Verified', desc: 'Every agent and title verified on an immutable ledger. Scan the QR code to confirm instantly.' },
  { icon: '🗺️', title: 'Disaster Risk Map', desc: 'See flood zones, fault lines, and typhoon tracks overlaid on every property location.' },
  { icon: '📋', title: 'SPA Workflow', desc: 'Step-by-step guide to sign your Special Power of Attorney from any country abroad.' },
  { icon: '💱', title: 'Multi-Currency', desc: 'View prices in USD, AED, SGD, HKD, and SAR alongside PHP in real time.' },
  { icon: '🏦', title: 'Financing Calculator', desc: 'Compute Pag-IBIG, bank loan, and in-house financing monthly payments instantly.' },
  { icon: '📊', title: 'Closing Cost Engine', desc: 'Get exact CGT, DST, and LGU transfer tax for any property location in the Philippines.' },
]

function FeatureCard({ f }: { f: typeof FEATURES[0] }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{
        background: '#0D0D0D',
        border: `1px solid ${hovered ? 'rgba(112,59,247,0.3)' : '#1A1A1A'}`,
        borderRadius: 12, padding: '28px 28px',
        transition: 'border-color 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 10,
        background: 'rgba(112,59,247,0.1)', border: '1px solid rgba(112,59,247,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, marginBottom: 20,
      }}>
        {f.icon}
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{f.title}</div>
      <div style={{ fontSize: 14, color: '#595959', lineHeight: 1.65 }}>{f.desc}</div>
    </div>
  )
}

export function FeaturesGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
      {FEATURES.map(f => <FeatureCard key={f.title} f={f} />)}
    </div>
  )
}
