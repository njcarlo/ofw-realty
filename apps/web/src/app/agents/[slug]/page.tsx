import { notFound } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import Link from 'next/link'

async function getAgent(slug: string) {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001'
  const res = await fetch(`${apiUrl}/agents/${slug}`, { next: { revalidate: 60 } })
  if (!res.ok) return null
  return res.json()
}

export default async function AgentPortfolioPage({ params }: { params: { slug: string } }) {
  const agent = await getAgent(params.slug)
  if (!agent) notFound()

  const activeListings = agent.listings?.filter((l: any) => l.status === 'active') ?? []
  const soldListings = agent.sold_listings ?? []

  return (
    <div style={{ background: '#000', color: '#fff', fontFamily: "'Inter', system-ui, sans-serif", minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 1596, margin: '0 auto', padding: '100px 162px 80px' }}>
        <Link href="/agents" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#595959', marginBottom: 32 }}>
          ← Back to Agents
        </Link>

        {/* Profile card */}
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 16, padding: 40, marginBottom: 32, display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: 'rgba(112,59,247,0.1)', border: '2px solid rgba(112,59,247,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, flexShrink: 0, overflow: 'hidden',
          }}>
            {agent.users?.avatar_url
              ? <img src={agent.users.avatar_url} style={{ width: 100, height: 100, objectFit: 'cover' }} alt="" />
              : '👤'}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0 }}>{agent.users?.full_name}</h1>
              {agent.verified_badge && (
                <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 99, border: '1px solid rgba(16,185,129,0.2)' }}>
                  ✓ Verified Agent
                </span>
              )}
            </div>
            {agent.broker_companies && (
              <Link href={`/brokers/${agent.broker_companies.slug}`} style={{ fontSize: 14, color: '#703BF7', marginBottom: 8, display: 'block' }}>
                🏢 {agent.broker_companies.name}
              </Link>
            )}
            {agent.prc_license_number && (
              <div style={{ fontSize: 13, color: '#595959', marginBottom: 8 }}>PRC License: <span style={{ color: '#999' }}>{agent.prc_license_number}</span></div>
            )}
            {agent.users?.bio && (
              <p style={{ fontSize: 14, color: '#595959', lineHeight: 1.7, maxWidth: 600, margin: 0 }}>{agent.users.bio}</p>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link href={`/map`} style={{
              background: '#703BF7', color: '#fff', padding: '12px 24px', borderRadius: 8,
              fontSize: 14, fontWeight: 600, textAlign: 'center',
              boxShadow: '0 0 24px rgba(112,59,247,0.35)',
            }}>
              💬 Message Agent
            </Link>
            {agent.blockchain_qr_url && (
              <a href={agent.blockchain_qr_url} target="_blank" style={{
                background: 'transparent', color: '#999', padding: '12px 24px', borderRadius: 8,
                fontSize: 14, fontWeight: 500, textAlign: 'center', border: '1px solid #262626',
              }}>
                🔐 Verify QR
              </a>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
          {[
            { label: 'Active Listings', value: activeListings.length, icon: '🏠' },
            { label: 'Properties Sold', value: soldListings.length, icon: '✅' },
            { label: 'Verified', value: agent.verified_badge ? 'Yes' : 'No', icon: '🔐' },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 28 }}>{stat.icon}</span>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#703BF7' }}>{stat.value}</div>
                <div style={{ fontSize: 13, color: '#595959' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Active listings */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Active Listings ({activeListings.length})</div>
          {activeListings.length === 0 ? (
            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 32, textAlign: 'center', color: '#595959' }}>No active listings</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {activeListings.map((l: any) => {
                const photo = l.listing_photos?.find((p: any) => p.is_primary)?.url
                return (
                  <Link key={l.id} href={`/listings/${l.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
                      <div style={{ height: 160, background: '#141414' }}>
                        {photo ? <img src={photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#262626' }}>🏠</div>}
                      </div>
                      <div style={{ padding: 16 }}>
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

        {/* Transaction history */}
        {soldListings.length > 0 && (
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Transaction History ({soldListings.length} sold)</div>
            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
              {soldListings.map((l: any, i: number) => (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: i < soldListings.length - 1 ? '1px solid #141414' : 'none' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{l.title}</div>
                    <div style={{ fontSize: 12, color: '#595959', marginTop: 2 }}>📍 {l.city}, {l.province}</div>
                  </div>
                  <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 99, border: '1px solid rgba(16,185,129,0.2)' }}>Sold</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
