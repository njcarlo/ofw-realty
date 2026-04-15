import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? ''

  if (!apiUrl) return NextResponse.json([])

  try {
    const res = await fetch(`${apiUrl}/spa/embassies?q=${encodeURIComponent(q)}`)
    if (!res.ok) return NextResponse.json([])
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json([])
  }
}
