import { notFound } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import Link from 'next/link'

async function getBroker(slug: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? ''
  if (!apiUrl) return null
  try {
    const res = await fetch(`${apiUrl}/brokers/${slug}`, { next: { revalidate: 60 } })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

export default async function BrokerProfilePage({ params }: { params: { slug: string } }) {
  const broker = await getBroker(params.slug)
  if (!broker) notFound()

  const activeListings = broker.listings?.filter((l: any) => l.status === 'active') ?? []

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 40px 80px' }}>
        <Link href="/brokers" style={{ fontSize: 14, color: '#595959', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 28 }}>
          ← Back to Brokerages
        </Link>

        {/* Cover + header */}
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 16, overflow: 'hidden', marginBottom: 28 }}>
          <div style={{ height: 140, background: 'linear-gradient(135deg, rgba(112,59,247,0.3), rgba(112,59,247,0.05))' }}>
            {broker.cover_url && <img src={broker.cover_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />}
          </div>
          <div style={{ padding: '0 28px 28px' }}>
            <div style={{ width: 72, height: 72, borderRadius: 12, background: '#141414', border: '2px solid #262626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginTop: -36, marginBottom: 16, overflow: 'hidden' }}>
              {broker.logo_url ? <img src={broker.logo_url} style={{ width: 72, height: 72, objectFit: 'cover' }} alt="" /> : '🏢'}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0 }}>{broker.name}</h1>
                  {broker.verified_badge && (
                    <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 99, border: '1px solid rgba(16,185,129,0.2)' }}>✓ Verified</span>
                  )}
                </div>
                {broker.office_address && <p style={{ fontSize: 14, color: '#595959', margin: '0 0 4px' }}>📍 {broker.office_address}</p>}
                {broker.description && <p style={{ fontSize: 14, color: '#595959', lineHeight: 1.7, maxWidth: 600, margin: '12px 0 0' }}>{broker.description}</p>}
              </div>
              <button style={{ background: '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 20px rgba(112,59,247,0.3)' }}>
                💬 Contact Brokerage
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 28, alignItems: 'start' }}>
          {/* Listings */}
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Active Listings ({activeListings.length})</div>
            {activeListings.length === 0 ? (
              <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 32, textAlign: 'center', color: '#595959' }}>No active listings</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
                {activeListings.map((l: any) => {
                  const photo = l.listing_photos?.find((p: any) => p.is_primary)?.url
                  return (
                    <Link key={l.id} href={`/listings/${l.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
                        <div style={{ height: 140, background: '#141414' }}>
                          {photo ? <img src={photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#262626' }}>🏠</div>}
                        </div>
                        <div style={{ padding: 14 }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#703BF7', marginBottom: 4 }}>₱{Number(l.price_php).toLocaleString()}</div>
                          <div style={{ fontSize: 13, color: '#999', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                          <div style={{ fontSize: 12, color: '#595959' }}>📍 {l.city}, {l.province}</div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Agents */}
          <div style={{ position: 'sticky', top: 100 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 14 }}>Our Agents ({broker.realtors?.length ?? 0})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(broker.realtors ?? []).map((agent: any) => (
                <Link key={agent.id} href={`/agents/${agent.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(112,59,247,0.1)', border: '1px solid rgba(112,59,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, overflow: 'hidden' }}>
                      {agent.users?.avatar_url ? <img src={agent.users.avatar_url} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} alt="" /> : '👤'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.users?.full_name}</div>
                      {agent.verified_badge && <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>✓ Verified</div>}
                    </div>
                    <span style={{ fontSize: 12, color: '#595959' }}>→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
