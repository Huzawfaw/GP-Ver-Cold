import { NextRequest, NextResponse } from 'next/server'
import { verifyJwt } from '@/lib/auth'
export async function GET(req: NextRequest){
  const cookie = req.cookies.get('auth')?.value
  if(!cookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const me = await verifyJwt(cookie)
    return NextResponse.json(me)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
