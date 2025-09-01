import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function xml(body: string, status = 200) {
  return new NextResponse(body, { status, headers: { 'Content-Type': 'text/xml' } })
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const to = String(form.get('To') || form.get('to') || '').trim()
    const company = String(form.get('company') || '').toLowerCase()

    // Accept both naming styles
    const FROM_CONNECTIV =
      process.env.TWILIO_FROM_CONNECTIV || process.env.COMPANY_CONNECTIV_NUMBER
    const FROM_BOOKSNPAYROLL =
      process.env.TWILIO_FROM_BOOKSNPAYROLL || process.env.COMPANY_BOOKSNPAYROLL_NUMBER

    const FROM_MAP: Record<string, string | undefined> = {
      connectiv: FROM_CONNECTIV,
      booksnpayroll: FROM_BOOKSNPAYROLL,
    }

    const from = FROM_MAP[company] || FROM_CONNECTIV

    if (!to || !from) {
      return xml('<Response><Say>Missing number or caller ID.</Say></Response>', 400)
    }

    const vr = new (twilio as any).twiml.VoiceResponse()
    const dial = vr.dial({ callerId: from })
    dial.number(to)

    return xml(vr.toString())
  } catch (e: any) {
    return xml(`<Response><Say>Error: ${e?.message ?? 'unknown'}</Say></Response>`, 500)
  }
}
