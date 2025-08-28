import { SignJWT, jwtVerify } from "jose";
const secret = new TextEncoder().encode(process.env.JWT_SECRET!);


export type JwtPayload = {
sub: string;
email: string;
extension: string;
companies: string[];
};


export async function signJwt(payload: JwtPayload) {
return await new SignJWT(payload)
.setProtectedHeader({ alg: "HS256" })
.setIssuedAt()
.setExpirationTime("7d")
.sign(secret);
}


export async function verifyJwt(token: string) {
const { payload } = await jwtVerify(token, secret);
return payload as unknown as JwtPayload;
}