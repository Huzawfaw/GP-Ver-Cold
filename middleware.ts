// middleware.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyJwt } from './lib/auth'

// Public routes (never gate)
const PUBLIC = [
  /^\/$/,                 // home (if any)
  /^\/login$/,            // login page
  /^\/api\/auth\/.*/,     // auth endpoints (login, me, logout, etc.)
  /^\/_next\/.*/,         // next assets
  /^\/favicon\.ico$/,     // favicon
]

// Pages that require a signed-in user
const PAGE_PROTECTED = [
  /^\/dialer(?:\/|$)/,
  /^\/logs(?:\/|$)/,
  /^\/recordings(?:\/|$)/,
  /^\/admin(?:\/|$)/,
]

// Admin-only areas (page + admin APIs)
const ADMIN_ONLY = [
  /^\/admin(?:\/|$)/,
  /^\/api\/admin(?:\/|$)/,
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public routes (and assets) straight through
  if (PUBLIC.some(rx => rx.test(pathname))) return NextResponse.next()

  // Only gate pages + admin API; regular APIs are handled in their route code
  const needsAuth =
    PAGE_PROTECTED.some(rx => rx.test(pathname)) ||
    ADMIN_ONLY.some(rx => rx.test(pathname))

  if (!needsAuth) return NextResponse.next()

  const token = req.cookies.get('auth')?.value
  if (!token) {
    const url = new URL('/login', req.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  let user: any
  try {
    user = await verifyJwt(token) // must work on edge; your verifyJwt already does since admin works
  } catch {
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.set('auth', '', { path: '/', maxAge: 0 })
    return res
  }

  // Admin-only check
  const wantsAdmin = ADMIN_ONLY.some(rx => rx.test(pathname))
  if (wantsAdmin && !user?.isAdmin) {
    // Non-admin trying admin stuff: send to dialer, not login
    return NextResponse.redirect(new URL('/dialer', req.url))
  }

  return NextResponse.next()
}

// IMPORTANT: do not match every /api route — only admin APIs
export const config = {
  matcher: [
    '/dialer/:path*',
    '/logs/:path*',
    '/recordings/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
  ],
}
