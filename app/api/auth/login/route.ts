// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { signJwt } from '@/lib/auth'
import { ROOT_ADMIN } from '@/lib/root-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type DbAgent = {
  id: string
  email: string
  extension: string
  password: string
  companies: string
  isAdmin: boolean
}

function setAuth(res: NextResponse, token: string) {
  res.cookies.set('auth', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}

// If someone browses to /api/auth/login with GET, send them to /login (no 405)
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/login', req.url))
}

export async function POST(req: NextRequest) {
  // accept form or json
  let email = '', password = ''
  const ct = req.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    const b = await req.json()
    email = String(b?.email || '').toLowerCase()
    password = String(b?.password || '')
  } else {
    const fd = await req.formData()
    email = String(fd.get('email') || '').toLowerCase()
    password = String(fd.get('password') || '')
  }

  // Hard-coded root admin
  if (email === ROOT_ADMIN.email.toLowerCase() && password === ROOT_ADMIN.password) {
    const admin = await prisma.agent.upsert({
      where: { email },
      update: {
        isAdmin: true,
        extension: ROOT_ADMIN.extension,
        companies: JSON.stringify(ROOT_ADMIN.companies),
      },
      create: {
        email,
        name: 'Admin',
        password: await bcrypt.hash(ROOT_ADMIN.password, 10),
        extension: ROOT_ADMIN.extension,
        companies: JSON.stringify(ROOT_ADMIN.companies),
        available: false,
        isAdmin: true,
      },
      select: { id: true, email: true, extension: true, companies: true, isAdmin: true },
    })

    const companies = JSON.parse(admin.companies) as string[]
    const token = await signJwt({
      sub: admin.id, email: admin.email, extension: admin.extension, companies, isAdmin: true,
    })

    const res = NextResponse.redirect(new URL('/admin', req.url))
    return setAuth(res, token)
  }

  // Normal agent
  const agent = await prisma.agent.findUnique({
    where: { email },
    select: { id: true, email: true, extension: true, password: true, companies: true, isAdmin: true },
  }) as DbAgent | null

  if (!agent) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  const ok = await bcrypt.compare(password, agent.password)
  if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

  const companies = JSON.parse(agent.companies) as string[]
  const token = await signJwt({
    sub: agent.id, email: agent.email, extension: agent.extension, companies, isAdmin: !!agent.isAdmin,
  })

  const dest = agent.isAdmin ? '/admin' : '/dialer'
  const res = NextResponse.redirect(new URL(dest, req.url))
  return setAuth(res, token)
}
