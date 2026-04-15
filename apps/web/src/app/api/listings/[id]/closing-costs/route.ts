import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(req.url)
  const sellingPrice = searchParams.get('selling_price')
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'http://localhost:3001'
  const url = `${apiUrl}/listings/${params.id}/closing-costs${sellingPrice ? `?selling_price=${sellingPrice}` : ''}`
  try {
    const res = await fetch(url)
    if (!res.ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ error: 'API unavailable' }, { status: 503 })
  }
}
