import { PageShell } from '@/components/PageShell'
import Link from 'next/link'

const CHANNELS = [
  {
    name: 'Bank Wire Transfer', icon: '🏦',
    description: 'Direct bank-to-bank transfer to Philippine banks (BDO, BPI, Metrobank, UnionBank)',
    steps: ['Log in to your overseas bank', 'Add recipient bank details (account name, number, SWIFT code)', 'Enter amount in PHP or your local currency', 'Confirm and submit — funds arrive in 1-3 business days'],
    fees: 'USD 15–35 per transfer', processing: '1–3 business days', minAmount: 'No minimum', recommended: true,
  },
  {
    name: 'Wise (formerly TransferWise)', icon: '🌐',
    description: 'Online transfer with real exchange rates and low fees',
    steps: ['Create a Wise account at wise.com', 'Set up a transfer to a Philippine bank account', 'Pay via bank transfer or debit card', 'Recipient receives PHP in their account'],
    fees: '0.4–1.5% of transfer amount', processing: '1–2 business days', minAmount: 'USD 1', recommended: true,
  },
  {
    name: 'Remitly', icon: '✈️',
    description: 'OFW-focused remittance app with competitive rates',
    steps: ['Download the Remitly app', 'Create an account and verify identity', 'Set up transfer to Philippine bank or e-wallet', 'Track delivery in real time'],
    fees: 'USD 0–4 (Economy) or USD 3.99 (Express)', processing: 'Economy: 3-5 days | Express: Minutes', minAmount: 'USD 10', recommended: true,
  },
  {
    name: 'Western Union / MoneyGram', icon: '💸',
    description: 'Send cash or bank deposit to the Philippines through remittance centers',
    steps: ['Visit a Western Union or MoneyGram agent near you', 'Provide recipient details and amount', 'Pay in local currency', 'Share the tracking number with your recipient'],
    fees: '1–3% of transfer amount', processing: 'Minutes to 1 business day', minAmount: 'Varies by country', recommended: false,
  },
  {
    name: 'GCash / Maya (via partner)', icon: '📱',
    description: 'Send directly to GCash or Maya e-wallet in the Philippines',
    steps: ["Use a partner app (Remitly, WorldRemit, etc.)", "Select GCash or Maya as delivery method", "Enter recipient's mobile number", 'Funds arrive instantly to their e-wallet'],
    fees: 'USD 2–5 flat fee', processing: 'Instant to 1 hour', minAmount: 'USD 10', recommended: false,
  },
]

const PH_BANKS = [
  { name: 'BDO Unibank', swift: 'BNORPHMM', note: 'Largest bank in PH' },
  { name: 'BPI (Bank of the Philippine Islands)', swift: 'BOPIPHM1', note: 'Widely used for real estate' },
  { name: 'Metrobank', swift: 'MBTCPHMM', note: 'Common for developer payments' },
  { name: 'UnionBank', swift: 'UBPHPHMM', note: 'Best for online transfers' },
  { name: 'Land Bank of the Philippines', swift: 'TLBPPHMM', note: 'Government bank' },
]

export default function RemittancePage() {
  return (
    <PageShell badge="Remittance Guide" title="Send Money to the Philippines" subtitle="How to transfer funds from abroad to pay for your property — with the best rates and lowest fees.">

      {/* Warning */}
      <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderLeft: '3px solid #F59E0B', borderRadius: 12, padding: 20, marginBottom: 40 }}>
        <p style={{ fontSize: 14, color: '#F59E0B', margin: 0, lineHeight: 1.6 }}>
          ⚠️ <strong>Important:</strong> Always send payments directly to the developer's or seller's verified bank account. Never send to a personal account unless you have a signed Contract to Sell. Keep all transaction receipts as proof of payment.
        </p>
      </div>

      {/* Channels */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Remittance Channels</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {CHANNELS.map(channel => (
            <div key={channel.name} style={{
              background: '#0D0D0D',
              border: `1px solid ${channel.recommended ? 'rgba(16,185,129,0.2)' : '#1A1A1A'}`,
              borderRadius: 12, padding: 28, position: 'relative',
            }}>
              {channel.recommended && (
                <span style={{ position: 'absolute', top: -10, right: 16, background: 'rgba(16,185,129,0.15)', color: '#10B981', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, border: '1px solid rgba(16,185,129,0.2)' }}>
                  ✓ Recommended
                </span>
              )}
              <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                <span style={{ fontSize: 32 }}>{channel.icon}</span>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{channel.name}</div>
                  <div style={{ fontSize: 13, color: '#595959' }}>{channel.description}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Fees', value: channel.fees },
                  { label: 'Processing', value: channel.processing },
                  { label: 'Minimum', value: channel.minAmount },
                ].map(item => (
                  <div key={item.label} style={{ background: '#141414', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontSize: 10, color: '#595959', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#999', marginBottom: 8 }}>How to send:</div>
                <ol style={{ margin: 0, paddingLeft: 20 }}>
                  {channel.steps.map((step, i) => (
                    <li key={i} style={{ fontSize: 13, color: '#595959', marginBottom: 4, lineHeight: 1.5 }}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SWIFT codes */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Philippine Bank SWIFT Codes</div>
        <p style={{ fontSize: 14, color: '#595959', marginBottom: 20 }}>You'll need these for international wire transfers.</p>
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
          {PH_BANKS.map((bank, i) => (
            <div key={bank.name} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 24px', borderBottom: i < PH_BANKS.length - 1 ? '1px solid #141414' : 'none',
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{bank.name}</div>
                <div style={{ fontSize: 12, color: '#595959', marginTop: 2 }}>{bank.note}</div>
              </div>
              <code style={{ background: 'rgba(112,59,247,0.1)', border: '1px solid rgba(112,59,247,0.2)', padding: '5px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#703BF7', letterSpacing: '0.05em' }}>
                {bank.swift}
              </code>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 16, padding: '32px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Ready to buy?</div>
          <p style={{ fontSize: 14, color: '#595959', margin: 0 }}>Browse verified properties and connect with a trusted agent.</p>
        </div>
        <Link href="/" style={{ background: '#703BF7', color: '#fff', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, boxShadow: '0 0 24px rgba(112,59,247,0.35)' }}>
          Browse Properties →
        </Link>
      </div>
    </PageShell>
  )
}
