'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { PageShell } from '@/components/PageShell'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://ofw-realty-api-production.up.railway.app'

// The 9 documents a buyer should prepare
const BUYER_CHECKLIST = [
  { id: 'valid_id',       label: 'Valid Government ID (2 copies)',         desc: 'Passport, SSS, GSIS, PhilHealth, or Driver\'s License' },
  { id: 'tin',            label: 'TIN (Tax Identification Number)',         desc: 'Required for BIR tax clearance and title transfer' },
  { id: 'proof_income',   label: 'Proof of Income',                        desc: 'Payslips, ITR, or employment certificate (last 3 months)' },
  { id: 'bank_statement', label: 'Bank Statement (3 months)',               desc: 'Shows financial capacity for the purchase' },
  { id: 'proof_address',  label: 'Proof of Billing Address',               desc: 'Utility bill or bank statement with current address' },
  { id: 'marriage_cert',  label: 'Marriage Certificate (if applicable)',    desc: 'Required if buying jointly with spouse' },
  { id: 'spa',            label: 'Special Power of Attorney (OFW buyers)', desc: 'Notarized SPA authorizing a local representative' },
  { id: 'remittance',     label: 'Remittance Records (OFW buyers)',         desc: 'Proof of overseas income and remittances' },
  { id: 'pag_ibig',       label: 'Pag-IBIG Membership (if financing)',      desc: 'Required for Pag-IBIG housing loan applications' },
]

export default function DocumentsPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [authed, setAuthed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token
      if (!token) { setLoading(false); return }
      setAuthed(true)
      // Load saved checklist state from API if available
      try {
        const res = await fetch(`${API}/buyer/document-checklist`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setChecked(data.checked ?? {})
        }
      } catch {}
      setLoading(false)
    })
  }, [])

  async function toggle(id: string) {
    const next = { ...checked, [id]: !checked[id] }
    setChecked(next)
    // Persist to API (best-effort)
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (token) {
      fetch(`${API}/buyer/document-checklist`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ checked: next }),
      }).catch(() => {})
    }
  }

  const completedCount = Object.values(checked).filter(Boolean).length
  const progress = Math.floor((completedCount / BUYER_CHECKLIST.length) * 100)

  return (
    <PageShell badge="My Dashboard" title="Document Checklist" subtitle="Prepare your buyer documents before making an offer." backHref="/dashboard" backLabel="Dashboard">
      {!authed ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Sign in to track your document readiness.</p>
          <Link href="/login" style={{ background: '#703BF7', color: '#fff', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
        </div>
      ) : loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading checklist…</p>
      ) : (
        <div style={{ maxWidth: 680 }}>
          {/* Progress bar */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Document Readiness</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#703BF7' }}>{completedCount}/{BUYER_CHECKLIST.length} ready</span>
            </div>
            <div style={{ background: 'var(--border)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: progress === 100 ? '#10B981' : '#703BF7', borderRadius: 99, transition: 'width 0.4s' }} />
            </div>
            {progress === 100 && (
              <div style={{ marginTop: 12, fontSize: 13, color: '#10B981', fontWeight: 600 }}>
                ✅ All documents ready! You can proceed with your property purchase.
              </div>
            )}
          </div>

          {/* Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {BUYER_CHECKLIST.map(item => (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 18px',
                  background: checked[item.id] ? 'rgba(16,185,129,0.06)' : 'var(--bg-secondary)',
                  border: `1px solid ${checked[item.id] ? 'rgba(16,185,129,0.25)' : 'var(--border)'}`,
                  borderRadius: 10, cursor: 'pointer', textAlign: 'left', width: '100%',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                  background: checked[item.id] ? '#10B981' : 'transparent',
                  border: `2px solid ${checked[item.id] ? '#10B981' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, color: '#fff', transition: 'all 0.15s',
                }}>
                  {checked[item.id] ? '✓' : ''}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: checked[item.id] ? '#10B981' : 'var(--text-primary)', marginBottom: 3 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 24, padding: '14px 18px', background: 'rgba(112,59,247,0.06)', border: '1px solid rgba(112,59,247,0.2)', borderRadius: 10, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            💡 <strong style={{ color: 'var(--text-primary)' }}>Tip:</strong> OFW buyers should prepare their SPA and remittance records early — these take the most time to process. Visit the <Link href="/spa" style={{ color: '#703BF7' }}>SPA Guide</Link> for step-by-step instructions.
          </div>
        </div>
      )}
    </PageShell>
  )
}
