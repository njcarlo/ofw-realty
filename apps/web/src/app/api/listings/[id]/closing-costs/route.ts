import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(req.url)
  const sellingPrice = searchParams.get('selling_price')
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001'
  const url = `${apiUrl}/listings/${params.id}/closing-costs${sellingPrice ? `?selling_price=${sellingPrice}` : ''}`
  const res = await fetch(url)
  const data = await res.json()
  return NextResponse.json(data)
}
