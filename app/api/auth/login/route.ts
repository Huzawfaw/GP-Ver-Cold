import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { signJwt } from '@/lib/auth'
import { ensureAdminSeed } from '@/lib/seed'

export async function POST(req: NextRequest){
  // 1) Ensure admin exists (one-time; safe to call every login)
  await ensureAdminSeed()

  // 2) Normal login
  const { email, password } = await req.json()
  const e = String(email || '').toLowerCase()

  const agent = await prisma.agent.findUnique({ where: { email: e } })
  if (!agent) return new NextResponse('Invalid credentials', { status: 401 })

  const ok = await bcrypt.compare(password, agent.password)
  if (!ok) return new NextResponse('Invalid credentials', { status: 401 })

  const companies = JSON.parse(agent.companies as unknown as string) as string[]

  const token = await signJwt({
    sub: agent.id,
    email: agent.email,
    extension: agent.extension,
    companies,
    isAdmin: agent.isAdmin ?? false,   // include admin flag in JWT
  })

  const secure = process.env.NODE_ENV === 'production'
  const headers = new Headers()
  headers.append('Set-Cookie',
    `auth=${token}; Path=/; HttpOnly; SameSite=Lax; ${secure ? 'Secure;' : ''} Max-Age=604800`
  )

  return new NextResponse(JSON.stringify({ ok: true }), { status: 200, headers })
}
