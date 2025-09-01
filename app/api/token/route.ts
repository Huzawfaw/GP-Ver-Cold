import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const identity = searchParams.get('identity') || 'agent'
  const debug = searchParams.get('debug') === '1'

  // Accept both naming styles so you don't have to rename envs
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
        error: 'missing_env',
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

  try {
    const AccessToken = (twilio as any).jwt.AccessToken
    const VoiceGrant = (twilio as any).jwt.AccessToken.VoiceGrant

    const grant = new VoiceGrant({
      outgoingApplicationSid: APP_SID,
      incomingAllow: true,
    })

    const token = new AccessToken(ACCOUNT_SID, API_KEY_SID, API_KEY_SECRET, {
      identity,
      ttl: 3600,
    })
    token.addGrant(grant)

    const body: any = { token: token.toJwt() }
    if (debug) {
      body.debug = {
        accountSid: mask(ACCOUNT_SID),
        apiKeySid: mask(API_KEY_SID),
        appSid: mask(APP_SID),
        note: 'All three must belong to the same Twilio project.',
      }
    }

    return NextResponse.json(body)
  } catch (e: any) {
    return NextResponse.json(
      { error: 'token_build_failed', detail: e?.message ?? String(e) },
      { status: 500 }
    )
  }
}

function mask(v?: string) {
  if (!v) return v
  if (v.length <= 6) return v
  return v.slice(0, 4) + '…' + v.slice(-4)
}
