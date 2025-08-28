import twilio from 'twilio'
import type { NextRequest } from 'next/server'


export function getFullUrl(req: NextRequest){
const proto = req.headers.get('x-forwarded-proto') ?? 'https'
const host = req.headers.get('host')
const url = new URL(req.url)
return `${proto}://${host}${url.pathname}${url.search}`
}


export function validateWithParams(req: NextRequest, params: Record<string,string>){
const signature = req.headers.get('x-twilio-signature') || ''
const authToken = process.env.TWILIO_AUTH_TOKEN!
const full = getFullUrl(req)
return twilio.validateRequest(authToken, signature, full, params)
}