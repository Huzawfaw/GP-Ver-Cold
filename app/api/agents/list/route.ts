import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJwt } from '@/lib/auth'


export async function GET(req: NextRequest){
const cookie = req.cookies.get('auth')?.value
if(!cookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
const me = await verifyJwt(cookie)
const company = new URL(req.url).searchParams.get('company') || 'connectiv'
const agents = await prisma.agent.findMany({ select: { id: true, name: true, extension: true, available: true, companies: true } })
const filtered = agents.filter(a => (a.companies as string[]).includes(company))
return NextResponse.json(filtered)
}