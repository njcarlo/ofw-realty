import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { type: string } }
) {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001'
  const res = await fetch(`${apiUrl}/map/hazard-layers/${params.type}`)
  if (!res.ok) {
    return NextResponse.json({ error: 'Layer unavailable' }, { status: 503 })
  }
  const data = await res.json()
  return NextResponse.json(data)
}
