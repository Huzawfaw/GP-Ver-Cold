import { cookies } from 'next/headers'
import { verifyJwt } from '@/lib/auth'
import { isAdminEmail } from '@/lib/admin'
import AdminAgents from '@/components/admin-agents'

export default async function AdminPage() {
  const token = cookies().get('auth')?.value
  if (!token) return <div className="p-6">Not authorized.</div>
  try {
    const me = await verifyJwt(token)
    if (!isAdminEmail(me.email)) return <div className="p-6">Forbidden.</div>
  } catch {
    return <div className="p-6">Not authorized.</div>
  }

  return <AdminAgents />
}
