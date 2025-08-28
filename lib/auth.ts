import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret')

// What we store in the cookie
export type JwtUser = {
  sub: string
  email: string
  extension: string
  companies: string[]
  isAdmin: boolean
}

export async function signJwt(payload: JwtUser) {
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyJwt(token: string): Promise<JwtUser> {
  const { payload } = await jwtVerify(token, secret)
  return payload as unknown as JwtUser
}
