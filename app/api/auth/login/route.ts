import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { signJwt } from '@/lib/auth'
import { ensureAdminSeed } from '@/lib/seed'

export async function POST(req: NextRequest){
  // one-time: ensure admin exists if env vars are set
  await ensureAdminSeed()

  const { email, password } = await req.json()

  const agent = await prisma.agent.findUnique({ where: { email } })
  if (!agent) return new NextResponse('Invalid credentials', { status: 401 })

  const ok = await bcrypt.compare(password, agent.password)
  if (!ok) return new NextResponse('Invalid credentials', { status: 401 })

  const companies = JSON.parse(agent.companies as unknown as string) as string[]

  const token = await signJwt({
    sub: agent.id,
    email: agent.email,
    extension: agent.extension,
    companies
  })

  const secure = process.env.NODE_ENV === 'production'
  const headers = new Headers()
  headers.append('Set-Cookie', `auth=${token}; Path=/; HttpOnly; SameSite=Lax; ${secure ? 'Secure;' : ''} Max-Age=604800`)
  return new NextResponse(JSON.stringify({ ok: true }), { status: 200, headers })
}
