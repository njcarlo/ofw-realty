'use client'
import Link from 'next/link'

const TYPE_LABELS: Record<string, string> = {
  residential_lot: 'Residential Lot', house_and_lot: 'House & Lot',
  condo: 'Condo', commercial: 'Commercial', farm_lot: 'Farm Lot',
}

interface Props {
  listings: any[]
  selectedId: string | null
  onSelect: (listing: any) => void
  onHover: (id: string | null) => void
}

export function ListingPanel({ listings, selectedId, onSelect, onHover }: Props) {
  const selectedListing = listings.find(l => l.id === selectedId)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0D0D0D' }}>

      {/* Selected listing preview */}
      {selectedListing && (
        <div style={{ background: '#141414', borderBottom: '1px solid #1A1A1A', padding: 16, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 80, height: 72, borderRadius: 8, overflow: 'hidden', background: '#0D0D0D', flexShrink: 0 }}>
              {selectedListing.listing_photos?.[0]?.url ? (
                <img src={selectedListing.listing_photos[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#262626' }}>🏠</div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, background: 'rgba(112,59,247,0.15)', color: '#703BF7', padding: '2px 6px', borderRadius: 99, fontWeight: 600, border: '1px solid rgba(112,59,247,0.2)' }}>
                  {TYPE_LABELS[selectedListing.property_type] ?? selectedListing.property_type}
                </span>
                {selectedListing.is_featured && <span style={{ fontSize: 10, background: 'rgba(245,158,11,0.15)', color: '#F59E0B', padding: '2px 6px', borderRadius: 99, fontWeight: 600 }}>⭐</span>}
                {selectedListing.blockchain_verified && <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.15)', color: '#10B981', padding: '2px 6px', borderRadius: 99, fontWeight: 600 }}>✓</span>}
              </div>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#703BF7', margin: '0 0 2px' }}>
                ₱{Number(selectedListing.price_php).toLocaleString()}
              </p>
              <p style={{ fontSize: 12, color: '#ccc', margin: '0 0 2px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedListing.title}
              </p>
              <p style={{ fontSize: 11, color: '#595959', margin: 0 }}>📍 {selectedListing.city}, {selectedListing.province}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href={`/listings/${selectedListing.id}`} style={{
              flex: 1, background: '#703BF7', color: '#fff', textDecoration: 'none',
              borderRadius: 8, padding: '9px 0', fontSize: 13, fontWeight: 600,
              textAlign: 'center', display: 'block',
              boxShadow: '0 0 16px rgba(112,59,247,0.3)',
            }}>
              View Full Listing →
            </Link>
            <button onClick={() => onSelect(null as any)} style={{
              background: '#141414', color: '#595959', border: '1px solid #1A1A1A',
              borderRadius: 8, padding: '9px 12px', fontSize: 13, cursor: 'pointer',
            }}>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Listing list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {listings.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: '#595959' }}>
            <p style={{ fontSize: 32, margin: '0 0 8px' }}>🗺️</p>
            <p style={{ fontSize: 14 }}>Move the map to see listings</p>
          </div>
        )}
        {listings.map((listing) => {
          const isSelected = selectedId === listing.id
          const photo = listing.listing_photos?.find((p: any) => p.is_primary)?.url ?? listing.listing_photos?.[0]?.url
          const typeLabel = TYPE_LABELS[listing.property_type] ?? listing.property_type

          return (
            <div
              key={listing.id}
              id={`listing-${listing.id}`}
              onClick={() => onSelect(listing)}
              onMouseEnter={() => onHover(listing.id)}
              onMouseLeave={() => onHover(null)}
              style={{
                display: 'flex', gap: 12, padding: '12px 16px',
                borderBottom: '1px solid #141414', cursor: 'pointer',
                background: isSelected ? 'rgba(112,59,247,0.08)' : 'transparent',
                borderLeft: isSelected ? '3px solid #703BF7' : '3px solid transparent',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ width: 80, height: 72, borderRadius: 8, overflow: 'hidden', background: '#141414', flexShrink: 0 }}>
                {photo ? (
                  <img src={photo} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#262626' }}>🏠</div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: '#595959', fontWeight: 500, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{typeLabel}</div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#703BF7', margin: '0 0 2px' }}>
                  ₱{Number(listing.price_php).toLocaleString()}
                </p>
                <p style={{ fontSize: 12, color: '#ccc', margin: '0 0 2px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {listing.title}
                </p>
                <p style={{ fontSize: 11, color: '#595959', margin: 0 }}>📍 {listing.city}, {listing.province}</p>
                {listing.blockchain_verified && <span style={{ fontSize: 10, color: '#10B981', fontWeight: 600 }}>✓ Verified</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', color: isSelected ? '#703BF7' : '#262626', fontSize: 16, flexShrink: 0 }}>
                {isSelected ? '📍' : '›'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
