import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJwt } from '@/lib/auth'
import { isAdminEmail } from '@/lib/admin'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  extension: z.string().min(3),
  companies: z.array(z.string()).min(1)
})

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const me = await verifyJwt(token)
  if (!isAdminEmail(me.email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const agents = await prisma.agent.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, name: true, extension: true, available: true, companies: true, createdAt: true }
  })

  const data = agents.map(a => ({
    ...a,
    companies: JSON.parse(a.companies as unknown as string) as string[]
  }))
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('auth')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const me = await verifyJwt(token)
  if (!isAdminEmail(me.email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json(parsed.error.format(), { status: 400 })

    const { email, name, password, extension, companies } = parsed.data
    const hash = await bcrypt.hash(password, 10)

    const agent = await prisma.agent.create({
      data: {
        email,
        name,
        password: hash,
        extension,
        companies: JSON.stringify(companies)
      },
      select: { id: true }
    })
    return NextResponse.json(agent, { status: 201 })
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'Email or extension already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
