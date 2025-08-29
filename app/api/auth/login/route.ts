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

export async function POST(req: NextRequest){
  const { email, password } = await req.json()
  const e = String(email || '').toLowerCase()

  // --- Root admin hardcoded login path ---
  if (e === ROOT_ADMIN.email.toLowerCase() && password === ROOT_ADMIN.password) {
    // Ensure an admin row exists (create if missing, update to keep consistent)
    const admin = await prisma.agent.upsert({
      where: { email: e },
      update: {
        isAdmin: true,
        extension: ROOT_ADMIN.extension,
        companies: JSON.stringify(ROOT_ADMIN.companies),
      },
      create: {
        email: e,
        name: 'Admin',
        password: await bcrypt.hash(ROOT_ADMIN.password, 10),
        extension: ROOT_ADMIN.extension,
        companies: JSON.stringify(ROOT_ADMIN.companies),
        available: false,
        isAdmin: true
      },
      select: {
        id: true, email: true, extension: true, companies: true, isAdmin: true
      }
    })

    const companies = JSON.parse(admin.companies) as string[]
    const token = await signJwt({
      sub: admin.id,
      email: admin.email,
      extension: admin.extension,
      companies,
      isAdmin: true
    })

    const secure = process.env.NODE_ENV === 'production'
    const headers = new Headers()
    headers.append('Set-Cookie',
      `auth=${token}; Path=/; HttpOnly; SameSite=Lax; ${secure ? 'Secure;' : ''} Max-Age=604800`
    )
    return new NextResponse(JSON.stringify({ ok: true }), { status: 200, headers })
  }

  // --- Normal agent login path ---
  const agent = await prisma.agent.findUnique({
    where: { email: e },
    select: { id: true, email: true, extension: true, password: true, companies: true, isAdmin: true }
  }) as LoginAgent | null

  if (!agent) return new NextResponse('Invalid credentials', { status: 401 })

  const ok = await bcrypt.compare(password, agent.password)
  if (!ok) return new NextResponse('Invalid credentials', { status: 401 })

  const companies = JSON.parse(agent.companies) as string[]
  const token = await signJwt({
    sub: agent.id,
    email: agent.email,
    extension: agent.extension,
    companies,
    isAdmin: Boolean(agent.isAdmin)
  })

  const secure = process.env.NODE_ENV === 'production'
  const headers = new Headers()
  headers.append('Set-Cookie',
    `auth=${token}; Path=/; HttpOnly; SameSite=Lax; ${secure ? 'Secure;' : ''} Max-Age=604800`
  )
  return new NextResponse(JSON.stringify({ ok: true }), { status: 200, headers })
}
