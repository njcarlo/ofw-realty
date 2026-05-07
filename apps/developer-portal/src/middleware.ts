import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const PUBLIC_PATHS = ['/onboarding', '/onboarding/verify-email']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public onboarding routes
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const accessToken = req.cookies.get('sb-access-token')?.value
    ?? req.headers.get('authorization')?.replace('Bearer ', '')

  if (!accessToken) {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })

  const { data: { user } } = await supabase.auth.getUser(accessToken)

  if (!user) {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  // Check developer role from user metadata
  const role = user.user_metadata?.role ?? user.app_metadata?.role
  if (role !== 'developer') {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
