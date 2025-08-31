import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { signJwt } from '@/lib/auth'
import { ROOT_ADMIN } from '@/lib/root-admin'

type LoginAgent = {
  id: string
  email: string
  extension: string
  password: string
  companies: string
  isAdmin: boolean
}

export async function POST(req: NextRequest) {
  // Accept both JSON (fetch) and form posts
  let email = ''
  let password = ''
  const ct = req.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    const body = await req.json()
    email = String(body?.email || '').toLowerCase()
    password = String(body?.password || '')
  } else {
    const fd = await req.formData()
    email = String(fd.get('email') || '').toLowerCase()
    password = String(fd.get('password') || '')
  }

  const redirectTo = req.nextUrl.searchParams.get('redirect') || '/admin'
  const secure = process.env.NODE_ENV === 'production'

  // --- Root admin hardcoded path ---
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
      sub: admin.id,
      email: admin.email,
      extension: admin.extension,
      companies,
      isAdmin: true,
    })

    // Write cookie + REDIRECT (server-side)
    const res = NextResponse.redirect(new URL(redirectTo, req.url))
    res.cookies.set('auth', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
    return res
  }

  // --- Normal agent login ---
  const agent = await prisma.agent.findUnique({
    where: { email },
    select: { id: true, email: true, extension: true, password: true, companies: true, isAdmin: true },
  }) as LoginAgent | null

  if (!agent) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

  const ok = await bcrypt.compare(password, agent.password)
  if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

  const companies = JSON.parse(agent.companies) as string[]
  const token = await signJwt({
    sub: agent.id,
    email: agent.email,
    extension: agent.extension,
    companies,
    isAdmin: !!agent.isAdmin,
  })

  // Write cookie + REDIRECT (server-side)
  const res = NextResponse.redirect(new URL(redirectTo, req.url))
  res.cookies.set('auth', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}
