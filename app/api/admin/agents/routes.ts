// app/api/admin/agents/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export const runtime = 'nodejs'           // Prisma needs Node runtime
export const dynamic = 'force-dynamic'    // don't statically optimize

// GET: list agents
export async function GET() {
  try {
    const rows = await prisma.agent.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, name: true, extension: true,
        available: true, companies: true, isAdmin: true, createdAt: true
      }
    })
    const data = rows.map(r => ({
      ...r,
      companies: JSON.parse((r.companies as unknown as string) ?? '[]') as string[]
    }))
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Failed to load agents', detail: e?.message, code: e?.code },
      { status: 500 }
    )
  }
}

const CreateAgent = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  extension: z.string().min(3),
  companies: z.array(z.string()).min(1),
})

// POST: create agent
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = CreateAgent.safeParse(body)
    if (!parsed.success) return NextResponse.json(parsed.error.format(), { status: 400 })

    const { email, name, password, extension, companies } = parsed.data
    const hash = await bcrypt.hash(password, 10)

    const agent = await prisma.agent.create({
      data: {
        email: email.toLowerCase(),
        name,
        password: hash,
        extension,
        companies: JSON.stringify(companies),
        isAdmin: false,
      },
      select: { id: true },
    })
    return NextResponse.json(agent, { status: 201 })
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'Email or extension already exists' }, { status: 409 })
    }
    return NextResponse.json(
      { error: 'Failed to create agent', detail: e?.message, code: e?.code },
      { status: 500 }
    )
  }
}
