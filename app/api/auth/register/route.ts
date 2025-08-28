import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  extension: z.string().min(3),
  companies: z.array(z.string())
})

export async function POST(req: NextRequest){
  const data = await req.json()
  const parsed = schema.safeParse(data)
  if(!parsed.success) return NextResponse.json(parsed.error.format(), { status: 400 })

  const { email, name, password, extension, companies } = parsed.data
  const hash = await bcrypt.hash(password, 10)

  const agent = await prisma.agent.create({
    data: {
      email,
      name,
      password: hash,
      extension,
      companies: JSON.stringify(companies) // <<<< IMPORTANT
    }
  })

  return NextResponse.json({ id: agent.id })
}
