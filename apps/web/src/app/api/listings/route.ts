import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001'
  const params = new URLSearchParams()
  if (searchParams.get('property_type')) params.set('property_type', searchParams.get('property_type')!)
  if (searchParams.get('city')) params.set('city', searchParams.get('city')!)
  if (searchParams.get('limit')) params.set('limit', searchParams.get('limit')!)

  try {
    const res = await fetch(`${apiUrl}/listings?${params}`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json([])
  }
}
