// middleware.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyJwt } from './lib/auth'

// Paths that need *any* authenticated user
const PROTECTED_PREFIXES = ['/dialer', '/logs', '/recordings', '/admin', '/api']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Public: allow the login page and auth endpoints through
  if (pathname === '/login' || pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  // Only guard the routes under our protected prefixes
  const needsAuth = PROTECTED_PREFIXES.some(
    p => pathname === p || pathname.startsWith(p + '/')
  )
  if (!needsAuth) return NextResponse.next()

  const token = req.cookies.get('auth')?.value
  if (!token) {
    const url = new URL('/login', req.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  try {
    const user = await verifyJwt(token) as {
      email?: string
      isAdmin?: boolean
      extension?: string
      companies?: string[] | unknown
    }

    // Admin-only: /admin and /api/admin/*
    const wantsAdmin = pathname === '/admin' || pathname.startsWith('/api/admin')
    if (wantsAdmin && !user?.isAdmin) {
      // non-admin trying to hit admin — send to dialer rather than loop to login
      return NextResponse.redirect(new URL('/dialer', req.url))
    }

    // Attach a tiny bit of debug so you can see it in the Network tab (Response headers)
    const res = NextResponse.next()
    res.headers.set('x-auth-email', String(user?.email ?? ''))
    res.headers.set('x-auth-admin', String(!!user?.isAdmin))
    return res
  } catch {
    // Bad/expired token -> clear and go to login
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.set('auth', '', { path: '/', maxAge: 0 })
    return res
  }
}

// Keep the matcher broad, but we explicitly allow /login and /api/auth/* above
export const config = {
  matcher: [
    '/dialer', '/logs', '/recordings', '/admin',
    '/api/:path*'
  ]
}
