import { NextRequest, NextResponse } from 'next/server'

// Demo pins for when API is unavailable
const DEMO_PINS = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [121.0244, 14.5547] }, properties: { id: 'd1', price_php: 3200000, property_type: 'house_and_lot', is_featured: true, blockchain_verified: true, scam_flagged: false } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [123.8854, 10.3157] }, properties: { id: 'd2', price_php: 4500000, property_type: 'condo', is_featured: true, blockchain_verified: true, scam_flagged: false } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [121.1244, 14.2794] }, properties: { id: 'd3', price_php: 1800000, property_type: 'residential_lot', is_featured: false, blockchain_verified: true, scam_flagged: false } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [121.1631, 13.9411] }, properties: { id: 'd4', price_php: 2500000, property_type: 'farm_lot', is_featured: false, blockchain_verified: false, scam_flagged: false } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [125.6128, 7.0731] }, properties: { id: 'd5', price_php: 5800000, property_type: 'house_and_lot', is_featured: true, blockchain_verified: true, scam_flagged: false } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [121.0509, 14.5547] }, properties: { id: 'd6', price_php: 12000000, property_type: 'commercial', is_featured: false, blockchain_verified: true, scam_flagged: false } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [120.9842, 14.5995] }, properties: { id: 'd7', price_php: 6500000, property_type: 'condo', is_featured: true, blockchain_verified: true, scam_flagged: false } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [122.5621, 10.7202] }, properties: { id: 'd8', price_php: 2200000, property_type: 'residential_lot', is_featured: false, blockchain_verified: false, scam_flagged: false } },
  ],
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? ''

  if (!apiUrl) return NextResponse.json(DEMO_PINS)

  try {
    const res = await fetch(
      `${apiUrl}/map/pins?minLat=${searchParams.get('minLat')}&maxLat=${searchParams.get('maxLat')}&minLng=${searchParams.get('minLng')}&maxLng=${searchParams.get('maxLng')}`,
      { next: { revalidate: 30 } }
    )
    if (!res.ok) return NextResponse.json(DEMO_PINS)
    const data = await res.json()
    const hasFeatures = data?.features?.length > 0
    return NextResponse.json(hasFeatures ? data : DEMO_PINS)
  } catch {
    return NextResponse.json(DEMO_PINS)
  }
}
