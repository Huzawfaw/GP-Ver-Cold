import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const identity = searchParams.get('identity') || 'agent'

    // Accept both naming styles
    const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
    const API_KEY_SID =
      process.env.TWILIO_API_KEY_SID || process.env.TWILIO_API_KEY
    const API_KEY_SECRET =
      process.env.TWILIO_API_KEY_SECRET || process.env.TWILIO_API_SECRET
    const APP_SID =
      process.env.TWILIO_APP_SID || process.env.TWILIO_TWIML_APP_SID

    if (!ACCOUNT_SID || !API_KEY_SID || !API_KEY_SECRET || !APP_SID) {
      return NextResponse.json(
        {
          error: 'Missing Twilio env vars',
          needed: {
            TWILIO_ACCOUNT_SID: !!ACCOUNT_SID,
            TWILIO_API_KEY_SID_or_TWILIO_API_KEY: !!API_KEY_SID,
            TWILIO_API_KEY_SECRET_or_TWILIO_API_SECRET: !!API_KEY_SECRET,
            TWILIO_APP_SID_or_TWILIO_TWIML_APP_SID: !!APP_SID,
          },
        },
        { status: 500 }
      )
    }

    const AccessToken = (twilio as any).jwt.AccessToken
    const VoiceGrant = (twilio as any).jwt.AccessToken.VoiceGrant

    const grant = new VoiceGrant({
      outgoingApplicationSid: APP_SID,
      incomingAllow: true,
    })

    const token = new AccessToken(ACCOUNT_SID, API_KEY_SID, API_KEY_SECRET, {
      identity,
    })
    token.addGrant(grant)

    return NextResponse.json({ token: token.toJwt() })
  } catch (e: any) {
    return NextResponse.json(
      { error: 'token_error', detail: e?.message ?? String(e) },
      { status: 500 }
    )
  }
}
