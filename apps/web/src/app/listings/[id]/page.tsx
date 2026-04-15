import { notFound } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { ClosingCostCalculator } from '@/components/ClosingCostCalculator'
import { ListingActions } from '@/components/ListingActions'
import Link from 'next/link'

const DEMO_LISTINGS: Record<string, any> = {
  'd1': { id: 'd1', title: 'Modern House & Lot in Bacoor Cavite', property_type: 'house_and_lot', price_php: 3200000, city: 'Bacoor', province: 'Cavite', lot_area_sqm: 120, block_number: '12', lot_number: '5', status: 'active', is_featured: true, blockchain_verified: true, description: 'Beautiful modern house and lot in a prime location in Bacoor, Cavite. Perfect for OFW families looking to invest in a safe and accessible community near Metro Manila. Features 3 bedrooms, 2 bathrooms, and a spacious living area.', listing_photos: [{ url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80', is_primary: true }, { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', is_primary: false }], realtors: { slug: 'maria-santos', prc_license_number: 'PRC-2024-001234', verified_badge: true, blockchain_qr_url: null, users: { full_name: 'Maria Santos', avatar_url: null, phone: '+63 917 123 4567', email: 'maria@lupaph.com' }, broker_companies: { name: 'LUPA PH Realty', slug: 'lupaph-realty' } } },
  'd2': { id: 'd2', title: 'Condo Unit in Cebu IT Park', property_type: 'condo', price_php: 4500000, city: 'Cebu City', province: 'Cebu', lot_area_sqm: 32, block_number: null, lot_number: '8B', status: 'active', is_featured: true, blockchain_verified: true, description: 'Studio unit in the heart of Cebu IT Park. Ideal for OFW investment with high rental yield potential. Fully furnished with modern amenities, gym, pool, and 24/7 security.', listing_photos: [{ url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80', is_primary: true }], realtors: { slug: 'juan-dela-cruz', prc_license_number: 'PRC-2024-005678', verified_badge: true, blockchain_qr_url: null, users: { full_name: 'Juan Dela Cruz', avatar_url: null, phone: '+63 918 234 5678', email: 'juan@lupaph.com' }, broker_companies: { name: 'Metro Realty Group', slug: 'metro-realty-group' } } },
  'd3': { id: 'd3', title: 'Residential Lot in Sta. Rosa Laguna', property_type: 'residential_lot', price_php: 1800000, city: 'Sta. Rosa', province: 'Laguna', lot_area_sqm: 200, block_number: '3', lot_number: '14', status: 'active', is_featured: false, blockchain_verified: true, description: 'Prime residential lot in Sta. Rosa, Laguna — one of the fastest growing cities in the Philippines. Near SLEX, malls, and schools. Perfect for building your dream home.', listing_photos: [{ url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80', is_primary: true }], realtors: { slug: 'ana-reyes', prc_license_number: 'PRC-2023-009012', verified_badge: false, blockchain_qr_url: null, users: { full_name: 'Ana Reyes', avatar_url: null, phone: '+63 919 345 6789', email: 'ana@lupaph.com' }, broker_companies: null } },
  'd4': { id: 'd4', title: 'Farm Lot in Lipa Batangas', property_type: 'farm_lot', price_php: 2500000, city: 'Lipa', province: 'Batangas', lot_area_sqm: 1000, block_number: null, lot_number: null, status: 'active', is_featured: false, blockchain_verified: false, description: 'Agricultural lot in Lipa, Batangas. Suitable for farming, agri-tourism, or retirement home. Cool climate, scenic views of Mt. Malarayat.', listing_photos: [{ url: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?w=800&q=80', is_primary: true }], realtors: { slug: 'carlo-mendoza', prc_license_number: 'PRC-2024-003456', verified_badge: true, blockchain_qr_url: null, users: { full_name: 'Carlo Mendoza', avatar_url: null, phone: '+63 920 456 7890', email: 'carlo@lupaph.com' }, broker_companies: { name: 'Visayas Properties', slug: 'visayas-properties' } } },
  'd5': { id: 'd5', title: 'House & Lot in Davao City', property_type: 'house_and_lot', price_php: 5800000, city: 'Davao City', province: 'Davao del Sur', lot_area_sqm: 180, block_number: '7', lot_number: '2', status: 'active', is_featured: true, blockchain_verified: true, description: 'Spacious house and lot in a gated subdivision in Davao City. 4 bedrooms, 3 bathrooms, with a large garden. Safe neighborhood with 24/7 security. Near schools, hospitals, and SM Lanang.', listing_photos: [{ url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80', is_primary: true }], realtors: { slug: 'liza-flores', prc_license_number: 'PRC-2022-007890', verified_badge: true, blockchain_qr_url: null, users: { full_name: 'Liza Flores', avatar_url: null, phone: '+63 921 567 8901', email: 'liza@lupaph.com' }, broker_companies: { name: 'LUPA PH Realty', slug: 'lupaph-realty' } } },
  'd6': { id: 'd6', title: 'Commercial Space in BGC Taguig', property_type: 'commercial', price_php: 12000000, city: 'Taguig', province: 'Metro Manila', lot_area_sqm: 85, block_number: null, lot_number: null, status: 'active', is_featured: false, blockchain_verified: true, description: 'Prime commercial space in Bonifacio Global City. Ground floor unit ideal for retail, restaurant, or office use. High foot traffic area near major BGC establishments.', listing_photos: [{ url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80', is_primary: true }], realtors: { slug: 'pedro-garcia', prc_license_number: 'PRC-2023-002345', verified_badge: false, blockchain_qr_url: null, users: { full_name: 'Pedro Garcia', avatar_url: null, phone: '+63 922 678 9012', email: 'pedro@lupaph.com' }, broker_companies: null } },
}

async function getListing(id: string) {
  // Return demo data for demo IDs
  if (DEMO_LISTINGS[id]) return DEMO_LISTINGS[id]

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

          {/* Right — price card (no sticky to avoid stacking context trapping modals) */}
          <div style={{ position: 'relative' }}>
            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 16, padding: 28, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#595959', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Asking Price</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{price}</div>
              {listing.lot_area_sqm && (
                <div style={{ fontSize: 13, color: '#595959', marginBottom: 24 }}>
                  ₱{Math.round(listing.price_php / listing.lot_area_sqm).toLocaleString()}/sqm
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <ListingActions
                  listingId={listing.id}
                  listingTitle={listing.title}
                  listingPrice={listing.price_php}
                  realtorName={realtor?.users?.full_name}
                />
                <Link href={`/listings/${listing.id}/closing-costs`} style={{ background: 'transparent', color: '#703BF7', border: '1px solid rgba(112,59,247,0.25)', borderRadius: 8, padding: '12px 0', fontSize: 14, fontWeight: 500, textAlign: 'center', display: 'block' }}>
                  🧮 Closing Cost Calculator
                </Link>
              </div>
            </div>

            {/* Closing cost calculator inline */}
            <div style={{ marginTop: 16 }}>
              <ClosingCostCalculator listingId={listing.id} listingPrice={listing.price_php} />
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
