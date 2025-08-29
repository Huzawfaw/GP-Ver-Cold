import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { signJwt } from '@/lib/auth'
import { ensureAdminSeed } from '@/lib/seed'

type LoginAgent = {
  id: string
  email: string
  extension: string
  password: string
  companies: string
  isAdmin: boolean
}

export async function POST(req: NextRequest){
  await ensureAdminSeed()

  const { email, password } = await req.json()
  const e = String(email || '').toLowerCase()

  const agent = await prisma.agent.findUnique({
    where: { email: e },
    select: {
      id: true,
      email: true,
      extension: true,
      password: true,
      companies: true,
      isAdmin: true
    }
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
