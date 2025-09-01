// middleware.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyJwt } from './lib/auth'

// Public: always allowed
const PUBLIC = [
  /^\/login$/,
  /^\/api\/auth\/.*/, // login / me / logout etc
  /^\/_next\/.*/,
  /^\/favicon\.ico$/,
]

// Admin-only: block unless isAdmin=true
const ADMIN_ONLY = [
  /^\/admin(?:\/|$)/,
  /^\/api\/admin(?:\/|$)/,
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC.some(rx => rx.test(pathname))) return NextResponse.next()

  const token = req.cookies.get('auth')?.value

  // Only gate admin pages & admin APIs
  const wantsAdmin = ADMIN_ONLY.some(rx => rx.test(pathname))
  if (!wantsAdmin) return NextResponse.next()

  if (!token) {
    const url = new URL('/login', req.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  try {
    const user = await verifyJwt(token)
    if (!user?.isAdmin) {
      // non-admin trying admin → send to dialer (not /login)
      return NextResponse.redirect(new URL('/dialer', req.url))
    }
    return NextResponse.next()
  } catch {
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.set('auth', '', { path: '/', maxAge: 0 })
    return res
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
}
