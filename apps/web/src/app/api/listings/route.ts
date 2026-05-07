import { NextRequest, NextResponse } from 'next/server'

const DEMO_LISTINGS = [
  { id: 'd1', title: 'Modern House & Lot in Bacoor Cavite', property_type: 'house_and_lot', price_php: 3200000, city: 'Bacoor', province: 'Cavite', lot_area_sqm: 120, lat: 14.4791, lng: 120.9646, is_featured: true, blockchain_verified: true, scam_flagged: false, status: 'active', listing_photos: [{ url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80', is_primary: true }] },
  { id: 'd2', title: 'Condo Unit in Cebu IT Park', property_type: 'condo', price_php: 4500000, city: 'Cebu City', province: 'Cebu', lot_area_sqm: 32, lat: 10.3157, lng: 123.8854, is_featured: true, blockchain_verified: true, scam_flagged: false, status: 'active', listing_photos: [{ url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80', is_primary: true }] },
  { id: 'd3', title: 'Residential Lot in Sta. Rosa Laguna', property_type: 'residential_lot', price_php: 1800000, city: 'Sta. Rosa', province: 'Laguna', lot_area_sqm: 200, lat: 14.2794, lng: 121.1244, is_featured: false, blockchain_verified: true, scam_flagged: false, status: 'active', listing_photos: [{ url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80', is_primary: true }] },
  { id: 'd4', title: 'Farm Lot in Lipa Batangas', property_type: 'farm_lot', price_php: 2500000, city: 'Lipa', province: 'Batangas', lot_area_sqm: 1000, lat: 13.9411, lng: 121.1631, is_featured: false, blockchain_verified: false, scam_flagged: false, status: 'active', listing_photos: [{ url: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?w=600&q=80', is_primary: true }] },
  { id: 'd5', title: 'House & Lot in Davao City', property_type: 'house_and_lot', price_php: 5800000, city: 'Davao City', province: 'Davao del Sur', lot_area_sqm: 180, lat: 7.0731, lng: 125.6128, is_featured: true, blockchain_verified: true, scam_flagged: false, status: 'active', listing_photos: [{ url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=80', is_primary: true }] },
  { id: 'd6', title: 'Commercial Space in BGC Taguig', property_type: 'commercial', price_php: 12000000, city: 'Taguig', province: 'Metro Manila', lot_area_sqm: 85, lat: 14.5547, lng: 121.0509, is_featured: false, blockchain_verified: true, scam_flagged: false, status: 'active', listing_photos: [{ url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80', is_primary: true }] },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? ''

  const propertyType = searchParams.get('property_type')

  if (!apiUrl) {
    const filtered = propertyType ? DEMO_LISTINGS.filter(l => l.property_type === propertyType) : DEMO_LISTINGS
    return NextResponse.json(filtered)
  }

  const params = new URLSearchParams()
  if (propertyType) params.set('property_type', propertyType)
  if (searchParams.get('city')) params.set('city', searchParams.get('city')!)
  if (searchParams.get('limit')) params.set('limit', searchParams.get('limit')!)

  try {
    const res = await fetch(`${apiUrl}/listings?${params}`, { next: { revalidate: 60 } })
    if (!res.ok) return NextResponse.json(propertyType ? DEMO_LISTINGS.filter(l => l.property_type === propertyType) : DEMO_LISTINGS)
    const data = await res.json()
    return NextResponse.json(data.length > 0 ? data : (propertyType ? DEMO_LISTINGS.filter(l => l.property_type === propertyType) : DEMO_LISTINGS))
  } catch {
    return NextResponse.json(propertyType ? DEMO_LISTINGS.filter(l => l.property_type === propertyType) : DEMO_LISTINGS)
  }
}

import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const realtor_id = body.realtor_id || 'a1b2c3d4-0000-0000-0000-000000000002' 
    const { request_agent, agent_note, ...dbPayload } = body

    const { data, error } = await supabase
      .from('listings')
      .insert({ ...dbPayload, realtor_id, status: 'active' })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (body.photo_urls && Array.isArray(body.photo_urls) && body.photo_urls.length > 0) {
      const photos = body.photo_urls.map((url: string, idx: number) => ({
        listing_id: data.id, url, is_primary: idx === 0, sort_order: idx
      }))
      await supabase.from('listing_photos').insert(photos)
    }

    return NextResponse.json({ id: data.id, success: true }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
