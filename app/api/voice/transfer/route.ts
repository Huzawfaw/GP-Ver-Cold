import { NextRequest, NextResponse } from 'next/server'
import { twilioClient } from '@/lib/twilio'
import { verifyJwt } from '@/lib/auth'


export async function POST(req: NextRequest){
const cookie = req.cookies.get('auth')?.value
if(!cookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
await verifyJwt(cookie)


const { callSid, targetExtension } = await req.json()
if(!callSid || !targetExtension) return NextResponse.json({ error: 'Missing params' }, { status: 400 })


const conferenceName = `xfer_${callSid}`


await twilioClient.calls(callSid).update({
twiml: `<?xml version="1.0" encoding="UTF-8"?><Response><Dial><Conference record=\"record-from-start\">${conferenceName}</Conference></Dial></Response>`
})


await twilioClient.calls.create({
to: `client:${targetExtension}`,
from: process.env.COMPANY_CONNECTIV_NUMBER!, // or choose dynamically
twiml: `<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Dial><Conference>${conferenceName}</Conference></Dial></Response>`
})


return NextResponse.json({ ok: true })
}