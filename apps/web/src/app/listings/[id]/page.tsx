import { notFound } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import Link from 'next/link'

async function getListing(id: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? ''
  if (!apiUrl) return null
  try {
    const res = await fetch(`${apiUrl}/listings/${id}`, { next: { revalidate: 60 } })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

const TYPE_LABELS: Record<string, string> = {
  residential_lot: 'Residential Lot', house_and_lot: 'House & Lot',
  condo: 'Condo', commercial: 'Commercial', farm_lot: 'Farm Lot',
}

export default async function ListingPage({ params }: { params: { id: string } }) {
  const listing = await getListing(params.id)
  if (!listing) notFound()

  const photos = listing.listing_photos ?? []
  const primaryPhoto = photos.find((p: any) => p.is_primary) ?? photos[0]
  const realtor = listing.realtors
  const price = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(listing.price_php)
  const typeLabel = TYPE_LABELS[listing.property_type] ?? listing.property_type

  return (
    <div style={{ background: '#000', color: '#fff', fontFamily: "'Inter', system-ui, sans-serif", minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 1596, margin: '0 auto', padding: '100px 162px 80px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#595959', marginBottom: 32 }}>
          ← Back to Listings
        </Link>

        {/* Hero image */}
        <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 32, position: 'relative', aspectRatio: '16/7', background: '#0D0D0D' }}>
          {primaryPhoto ? (
            <img src={primaryPhoto.url} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, color: '#1A1A1A' }}>🏠</div>
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)' }} />
          <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', gap: 8 }}>
            {listing.is_featured && <span style={{ background: '#703BF7', color: '#fff', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 99 }}>⭐ Featured</span>}
            {listing.blockchain_verified && <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 99, border: '1px solid rgba(16,185,129,0.3)' }}>✓ Blockchain Verified</span>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>
          {/* Left */}
          <div>
            <div style={{ fontSize: 12, color: '#595959', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{typeLabel}</div>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: 8 }}>{listing.title}</h1>
            <div style={{ fontSize: 15, color: '#595959', marginBottom: 32 }}>📍 {listing.address ? `${listing.address}, ` : ''}{listing.city}, {listing.province}</div>

            {/* Details grid */}
            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 28, marginBottom: 28 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Property Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                {[
                  { label: 'Property Type', value: typeLabel },
                  { label: 'Lot Area', value: listing.lot_area_sqm ? `${listing.lot_area_sqm} sqm` : '—' },
                  { label: 'Block No.', value: listing.block_number ?? '—' },
                  { label: 'Lot No.', value: listing.lot_number ?? '—' },
                  { label: 'Status', value: listing.status ?? 'Active' },
                  { label: 'Province', value: listing.province ?? '—' },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize: 11, color: '#595959', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {listing.description && (
              <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 28, marginBottom: 28 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 14 }}>About This Property</div>
                <p style={{ fontSize: 15, color: '#595959', lineHeight: 1.7, margin: 0 }}>{listing.description}</p>
              </div>
            )}

            {/* Photo strip */}
            {photos.length > 1 && (
              <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 28 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Photos ({photos.length})</div>
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                  {photos.map((p: any, i: number) => (
                    <img key={i} src={p.url} alt="" style={{ width: 140, height: 100, objectFit: 'cover', borderRadius: 8, flexShrink: 0, border: '1px solid #1A1A1A' }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — sticky price card */}
          <div style={{ position: 'sticky', top: 100 }}>
            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 16, padding: 28, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#595959', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Asking Price</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{price}</div>
              {listing.lot_area_sqm && (
                <div style={{ fontSize: 13, color: '#595959', marginBottom: 24 }}>
                  ₱{Math.round(listing.price_php / listing.lot_area_sqm).toLocaleString()}/sqm
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button style={{ background: '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '14px 0', fontSize: 15, fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 24px rgba(112,59,247,0.35)' }}>
                  💬 Send Inquiry
                </button>
                <button style={{ background: 'transparent', color: '#fff', border: '1px solid #262626', borderRadius: 8, padding: '12px 0', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                  📅 Schedule Viewing
                </button>
                <Link href={`/listings/${listing.id}/closing-costs`} style={{ background: 'transparent', color: '#703BF7', border: '1px solid rgba(112,59,247,0.25)', borderRadius: 8, padding: '12px 0', fontSize: 14, fontWeight: 500, textAlign: 'center', display: 'block' }}>
                  🧮 Closing Cost Calculator
                </Link>
              </div>
            </div>

            {/* Agent card */}
            {realtor && (
              <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 11, color: '#595959', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Listed By</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(112,59,247,0.1)', border: '1px solid rgba(112,59,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, overflow: 'hidden' }}>
                    {realtor.users?.avatar_url ? <img src={realtor.users.avatar_url} style={{ width: 48, height: 48, objectFit: 'cover' }} alt="" /> : '👤'}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{realtor.users?.full_name}</div>
                    {realtor.broker_companies && <div style={{ fontSize: 12, color: '#595959', marginTop: 2 }}>{realtor.broker_companies.name}</div>}
                    {realtor.verified_badge && <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600, marginTop: 2 }}>✓ Verified Agent</div>}
                  </div>
                </div>
                <Link href={`/agents/${realtor.slug}`} style={{ display: 'block', textAlign: 'center', padding: '10px 0', border: '1px solid #262626', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#999' }}>
                  View Agent Profile →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
