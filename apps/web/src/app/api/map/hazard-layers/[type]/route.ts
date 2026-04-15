import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { type: string } }
) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? ''
  if (!apiUrl) return NextResponse.json({ type: 'FeatureCollection', features: [] })

  try {
    const res = await fetch(`${apiUrl}/map/hazard-layers/${params.type}`, { next: { revalidate: 3600 } })
    if (!res.ok) return NextResponse.json({ type: 'FeatureCollection', features: [] })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ type: 'FeatureCollection', features: [] })
  }
}
