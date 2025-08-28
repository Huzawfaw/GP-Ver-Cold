import { NextRequest, NextResponse } from 'next/server'


export async function GET(req: NextRequest){
const sid = new URL(req.url).searchParams.get('sid')
if(!sid) return NextResponse.json({ error: 'sid required' }, { status: 400 })
const url = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Recordings/${sid}.mp3`
const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')
const r = await fetch(url, { headers: { Authorization: `Basic ${auth}` } })
return new NextResponse(r.body, { status: r.status, headers: { 'Content-Type': r.headers.get('Content-Type') || 'audio/mpeg' } })
}