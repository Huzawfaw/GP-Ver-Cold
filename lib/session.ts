// lib/session.ts
import { cookies } from 'next/headers'
import { verifyJwt } from '@/lib/auth'
import { redirect } from 'next/navigation'

export type SessionUser = {
  sub: string
  email: string
  extension: string
  companies: string[]
  isAdmin: boolean
}

export async function requireUser(): Promise<SessionUser> {
  const token = cookies().get('auth')?.value
  if (!token) redirect('/login')
  try {
    const user = await verifyJwt(token) as SessionUser
    return user
  } catch {
    redirect('/login')
  }
}
