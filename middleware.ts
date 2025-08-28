import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJwt } from './lib/auth'


const protectedMatchers = [
'/dialer',
'/logs',
'/recordings',
'/api/logs',
'/api/recordings',
'/api/agents',
'/api/token',
'/api/voice/transfer'
]


export async function middleware(req: NextRequest) {
const { pathname } = req.nextUrl
const needsAuth = protectedMatchers.some(p => pathname === p || pathname.startsWith(p + '/'))
if(!needsAuth) return NextResponse.next()
const token = req.cookies.get('auth')?.value
if(!token){
return NextResponse.redirect(new URL('/login', req.url))
}
try { await verifyJwt(token); return NextResponse.next() } catch {
return NextResponse.redirect(new URL('/login', req.url))
}
}


export const config = {
matcher: [
'/dialer', '/logs', '/recordings',
'/api/logs/:path*', '/api/recordings/:path*', '/api/agents/:path*', '/api/token', '/api/voice/transfer'
]
}