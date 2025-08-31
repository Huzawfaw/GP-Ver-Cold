import { NextRequest, NextResponse } from 'next/server'
import { verifyJwt } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const me = await verifyJwt(token)
    return NextResponse.json(me)
  } catch {
    return NextResponse.json({ error: 'Bad token' }, { status: 401 })
  }
}
