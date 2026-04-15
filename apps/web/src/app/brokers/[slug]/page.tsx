import { notFound } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import Link from 'next/link'

async function getBroker(slug: string) {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001'
  const res = await fetch(`${apiUrl}/brokers/${slug}`, { next: { revalidate: 60 } })
  if (!res.ok) return null
  return res.json()
}

export default async function BrokerProfilePage({ params }: { params: { slug: string } }) {
  const broker = await getBroker(params.slug)
  if (!broker) notFound()

  const activeListings = broker.listings?.filter((l: any) => l.status === 'active') ?? []

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '88px 24px 48px' }}>
        <Link href="/brokers" style={{ fontSize: 14, color: '#6b7280', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
          ← Back to brokerages
        </Link>

        {/* Cover + header */}
        <div style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 28, border: '1px solid #e5e7eb' }}>
          <div style={{ height: 160, background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', position: 'relative' }}>
            {broker.cover_url && (
              <img src={broker.cover_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            )}
          </div>
          <div style={{ padding: '0 28px 28px', position: 'relative' }}>
            {/* Logo */}
            <div style={{
              width: 80, height: 80, borderRadius: 16, background: 'white',
              border: '3px solid white', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 32, marginTop: -40,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)', marginBottom: 16,
            }}>
              {broker.logo_url
                ? <img src={broker.logo_url} style={{ width: 74, height: 74, borderRadius: 13, objectFit: 'cover' }} alt="" />
                : '🏢'}
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111', margin: 0 }}>{broker.name}</h1>
                  {broker.verified_badge && (
                    <span style={{ background: '#d1fae5', color: '#059669', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 99 }}>
                      ✓ Verified Brokerage
                    </span>
                  )}
                </div>
                {broker.office_address && (
                  <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 4px' }}>📍 {broker.office_address}</p>
                )}
                {broker.social_links && (
                  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    {broker.social_links.facebook && (
                      <a href={broker.social_links.facebook} target="_blank" style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none' }}>Facebook</a>
                    )}
                    {broker.social_links.instagram && (
                      <a href={broker.social_links.instagram} target="_blank" style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none' }}>Instagram</a>
                    )}
                  </div>
                )}
              </div>
              <button style={{
                background: '#2563eb', color: 'white', border: 'none',
                borderRadius: 12, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>
                💬 Contact Brokerage
              </button>
            </div>

            {broker.description && (
              <p style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.7, marginTop: 16, maxWidth: 700 }}>
                {broker.description}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32, alignItems: 'start' }}>
          {/* LEFT — Listings */}
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 16 }}>
              Active Listings ({activeListings.length})
            </h2>
            {activeListings.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: 14 }}>No active listings yet.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                {activeListings.map((l: any) => {
                  const photo = l.listing_photos?.find((p: any) => p.is_primary)?.url
                  return (
                    <Link key={l.id} href={`/listings/${l.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden' }}>
                        <div style={{ height: 140, background: '#f3f4f6' }}>
                          {photo
                            ? <img src={photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🏠</div>}
                        </div>
                        <div style={{ padding: 12 }}>
                          <p style={{ fontSize: 15, fontWeight: 700, color: '#1d4ed8', margin: '0 0 2px' }}>
                            ₱{Number(l.price_php).toLocaleString()}
                          </p>
                          <p style={{ fontSize: 13, color: '#374151', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</p>
                          <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>📍 {l.city}, {l.province}</p>
                          {l.blockchain_verified && <span style={{ fontSize: 10, color: '#059669', fontWeight: 600 }}>✓ Verified</span>}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* RIGHT — Agents */}
          <div style={{ position: 'sticky', top: 88 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 16 }}>
              Our Agents ({broker.realtors?.length ?? 0})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(broker.realtors ?? []).map((agent: any) => (
                <Link key={agent.id} href={`/agents/${agent.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 14,
                    transition: 'background 0.15s',
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', background: '#dbeafe',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
                    }}>
                      {agent.users?.avatar_url
                        ? <img src={agent.users.avatar_url} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} alt="" />
                        : '👤'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {agent.users?.full_name}
                      </p>
                      {agent.verified_badge && (
                        <span style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>✓ Verified</span>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>→</span>
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
