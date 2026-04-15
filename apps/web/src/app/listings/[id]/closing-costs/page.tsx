import { Navbar } from '@/components/Navbar'
import { ClosingCostCalculator } from '@/components/ClosingCostCalculator'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const DEMO_LISTINGS: Record<string, any> = {
  'd1': { id: 'd1', title: 'Modern House & Lot in Bacoor Cavite', price_php: 3200000, city: 'Bacoor', province: 'Cavite', property_type: 'house_and_lot' },
  'd2': { id: 'd2', title: 'Condo Unit in Cebu IT Park', price_php: 4500000, city: 'Cebu City', province: 'Cebu', property_type: 'condo' },
  'd3': { id: 'd3', title: 'Residential Lot in Sta. Rosa Laguna', price_php: 1800000, city: 'Sta. Rosa', province: 'Laguna', property_type: 'residential_lot' },
  'd4': { id: 'd4', title: 'Farm Lot in Lipa Batangas', price_php: 2500000, city: 'Lipa', province: 'Batangas', property_type: 'farm_lot' },
  'd5': { id: 'd5', title: 'House & Lot in Davao City', price_php: 5800000, city: 'Davao City', province: 'Davao del Sur', property_type: 'house_and_lot' },
  'd6': { id: 'd6', title: 'Commercial Space in BGC Taguig', price_php: 12000000, city: 'Taguig', province: 'Metro Manila', property_type: 'commercial' },
}

async function getListing(id: string) {
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

export default async function ClosingCostsPage({ params }: { params: { id: string } }) {
  const listing = await getListing(params.id)
  if (!listing) notFound()

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '100px 24px 80px' }}>

        <Link href={`/listings/${params.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#595959', marginBottom: 28 }}>
          ← Back to Listing
        </Link>

        {/* Property summary */}
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: '#595959', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            {TYPE_LABELS[listing.property_type] ?? listing.property_type}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{listing.title}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, color: '#595959' }}>📍 {listing.city}, {listing.province}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#703BF7' }}>
              ₱{Number(listing.price_php).toLocaleString()}
            </div>
          </div>
        </div>

        {/* What is closing cost */}
        <div style={{ background: 'rgba(112,59,247,0.06)', border: '1px solid rgba(112,59,247,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#703BF7', marginBottom: 6 }}>ℹ️ What are closing costs?</div>
          <div style={{ fontSize: 13, color: '#595959', lineHeight: 1.6 }}>
            Closing costs are taxes and fees paid when transferring property ownership in the Philippines. They are typically paid by the buyer and seller as agreed. The main costs are Capital Gains Tax (seller), Documentary Stamp Tax, Transfer Tax, and Registration Fee.
          </div>
        </div>

        {/* Calculator */}
        <ClosingCostCalculator listingId={params.id} listingPrice={Number(listing.price_php)} />

        {/* Financing link */}
        <div style={{ marginTop: 20, background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>Need financing?</div>
            <div style={{ fontSize: 13, color: '#595959' }}>Calculate your monthly amortization with Pag-IBIG or bank loan</div>
          </div>
          <Link href={`/listings/${params.id}`} style={{ background: '#703BF7', color: '#fff', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', boxShadow: '0 0 16px rgba(112,59,247,0.3)' }}>
            Financing Calculator →
          </Link>
        </div>
      </div>
    </div>
  )
}
