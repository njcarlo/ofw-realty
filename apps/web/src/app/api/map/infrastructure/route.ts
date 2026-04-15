import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001'
  try {
    const res = await fetch(`${apiUrl}/map/infrastructure`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ type: 'FeatureCollection', features: [] })
  }
}
