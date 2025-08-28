import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJwt } from './lib/auth'
import { isAdminEmail } from './lib/admin'

const protectedMatchers = [
  '/dialer',
  '/logs',
  '/recordings',
  '/api/logs',
  '/api/recordings',
  '/api/agents',
  '/api/token',
  '/api/voice/transfer',
  '/api/auth/register',   // registration now requires a logged-in user
  '/admin',               // admin UI
  '/api/admin'            // admin-only APIs
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const needsAuth = protectedMatchers.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (!needsAuth) return NextResponse.next()

  const token = req.cookies.get('auth')?.value
  if (!token) return NextResponse.redirect(new URL('/login', req.url))

  try {
    const payload = await verifyJwt(token)

    // Extra gate for admin-only paths
    const needsAdmin = pathname === '/admin' || pathname.startsWith('/api/admin')
    if (needsAdmin && !isAdminEmail(payload.email)) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: [
    '/dialer', '/logs', '/recordings', '/admin',
    '/api/logs/:path*', '/api/recordings/:path*', '/api/agents/:path*',
    '/api/token', '/api/voice/transfer',
    '/api/admin/:path*', '/api/auth/register'
  ]
}
