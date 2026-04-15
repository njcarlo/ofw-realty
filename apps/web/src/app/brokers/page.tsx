import { PageShell } from '@/components/PageShell'
import Link from 'next/link'

async function getBrokers(q?: string) {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001'
  try {
    const params = q ? `?q=${encodeURIComponent(q)}` : ''
    const res = await fetch(`${apiUrl}/brokers${params}`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    return res.json()
  } catch { return [] }
}

export default async function BrokerDirectory({ searchParams }: { searchParams: { q?: string } }) {
  const brokers = await getBrokers(searchParams.q)

  return (
    <PageShell badge="Brokerages" title="Trusted Real Estate Brokerages" subtitle="Browse verified Philippine real estate brokerages with blockchain-authenticated credentials.">
      <form style={{ display: 'flex', gap: 10, marginBottom: 40, maxWidth: 480 }}>
        <input name="q" defaultValue={searchParams.q} placeholder="Search by company name or location..."
          style={{ flex: 1, background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 8, padding: '12px 16px', fontSize: 14, color: '#fff', outline: 'none' }} />
        <button type="submit" style={{ background: '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Search</button>
      </form>

      {brokers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#595959' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#999', marginBottom: 8 }}>No brokerages found</div>
          <div style={{ fontSize: 14 }}>Brokerages will appear here once they register and get verified</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {brokers.map((broker: any) => (
            <Link key={broker.id} href={`/brokers/${broker.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                {/* Cover */}
                <div style={{ height: 80, background: 'linear-gradient(135deg, rgba(112,59,247,0.2), rgba(112,59,247,0.05))' }}>
                  {broker.cover_url && <img src={broker.cover_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />}
                </div>
                <div style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 10, background: '#141414', border: '1px solid #262626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, marginTop: -36, overflow: 'hidden' }}>
                      {broker.logo_url ? <img src={broker.logo_url} style={{ width: 52, height: 52, objectFit: 'cover' }} alt="" /> : '🏢'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{broker.name}</div>
                      {broker.office_address && <div style={{ fontSize: 12, color: '#595959', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {broker.office_address}</div>}
                    </div>
                  </div>
                  {broker.description && (
                    <p style={{ fontSize: 13, color: '#595959', lineHeight: 1.6, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {broker.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid #141414' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {broker.verified_badge && <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, border: '1px solid rgba(16,185,129,0.2)' }}>✓ Verified</span>}
                      {broker.realtors?.length > 0 && <span style={{ background: 'rgba(112,59,247,0.1)', color: '#703BF7', fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 99, border: '1px solid rgba(112,59,247,0.2)' }}>{broker.realtors.length} agents</span>}
                    </div>
                    <span style={{ fontSize: 13, color: '#703BF7', fontWeight: 600 }}>View →</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  )
}
