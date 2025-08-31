import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// Let this route always run on the server (no static caching)
export const dynamic = 'force-dynamic'

// GET: list agents (middleware already ensured you’re admin)
export async function GET() {
  try {
    const agents = await prisma.agent.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        extension: true,
        available: true,
        companies: true,
        isAdmin: true,
        createdAt: true,
      },
    })
    const data = agents.map(a => ({
      ...a,
      companies: JSON.parse(a.companies as unknown as string) as string[],
    }))
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load agents' }, { status: 500 })
  }
}

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  extension: z.string().min(3),
  companies: z.array(z.string()).min(1),
})

// POST: create agent (middleware already ensured you’re admin)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(parsed.error.format(), { status: 400 })
    }

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
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 })
  }
}
