import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function ensureAdminSeed() {
  const email = (process.env.ADMIN_SEED_EMAIL || '').toLowerCase()
  const password = process.env.ADMIN_SEED_PASSWORD
  if (!email || !password) return // not configured

  const existing = await prisma.agent.findUnique({ where: { email } })
  if (existing) return // already there

  const extension = process.env.ADMIN_SEED_EXTENSION || '9001'
  const companiesCSV = process.env.ADMIN_SEED_COMPANIES || 'connectiv,booksnpayroll'
  const companies = companiesCSV.split(',').map(s => s.trim()).filter(Boolean)

  const hash = await bcrypt.hash(password, 10)

  await prisma.agent.create({
    data: {
      email,
      name: 'Admin',
      password: hash,
      extension,
      companies: JSON.stringify(companies),
      available: false,
      isAdmin: true,      // <- make them admin
    }
  })
}
