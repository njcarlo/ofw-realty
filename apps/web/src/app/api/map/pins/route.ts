import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const minLat = searchParams.get('minLat')
  const maxLat = searchParams.get('maxLat')
  const minLng = searchParams.get('minLng')
  const maxLng = searchParams.get('maxLng')

  // Forward to NestJS API
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001'
  const res = await fetch(
    `${apiUrl}/map/pins?minLat=${minLat}&maxLat=${maxLat}&minLng=${minLng}&maxLng=${maxLng}`
  )
  const data = await res.json()
  return NextResponse.json(data)
}
