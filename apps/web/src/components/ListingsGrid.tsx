'use client'
import { ListingCard } from './ListingCard'

interface Props {
  listings: any[]
}

export function ListingsGrid({ listings }: Props) {
  if (listings.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: '#595959' }}>
        <p style={{ fontSize: 48, margin: '0 0 16px' }}>🏠</p>
        <p style={{ fontSize: 18, fontWeight: 600, color: '#999' }}>No listings found</p>
        <p style={{ fontSize: 14, color: '#595959' }}>Try a different category or check back later</p>
      </div>
    )
  }

  return (
    <>
      <p style={{ fontSize: 14, color: '#595959', marginBottom: 24 }}>
        <strong style={{ color: '#fff' }}>{listings.length} properties</strong> available
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 28,
      }}>
        {listings.map((listing: any) => (
          <ListingCard key={listing.id} listing={listing} variant="grid" />
        ))}
      </div>
    </>
  )
}
