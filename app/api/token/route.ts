import { NextRequest, NextResponse } from 'next/server';
import { jwt } from 'twilio';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const { AccessToken } = jwt;
const { VoiceGrant } = AccessToken;

function need(name: string, v?: string) {
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const identity = searchParams.get('identity') || 'agent';

    const ACCOUNT_SID      = need('TWILIO_ACCOUNT_SID', process.env.TWILIO_ACCOUNT_SID);
    const API_KEY_SID      = need('TWILIO_API_KEY_SID', process.env.TWILIO_API_KEY_SID);
    const API_KEY_SECRET   = need('TWILIO_API_KEY_SECRET', process.env.TWILIO_API_KEY_SECRET);
    const TWIML_APP_SID    = need('TWILIO_TWIML_APP_SID', process.env.TWILIO_TWIML_APP_SID);

    // Create an access token signed only with API Key + Secret.
    const token = new AccessToken(ACCOUNT_SID, API_KEY_SID, API_KEY_SECRET, { identity });

    // Voice grant points to your TwiML App (no REST fetch needed)
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: TWIML_APP_SID,
      // incomingAllow: true, // enable if you’ll receive Client calls
    });
    token.addGrant(voiceGrant);

    const jwtToken = token.toJwt();

    // Optional debug info
    const debug = searchParams.get('debug');
    if (debug) {
      return NextResponse.json({
        ok: true,
        jwtPreview: jwtToken.slice(0, 40) + '…',
        claims: {
          accountSid: ACCOUNT_SID,
          apiKeySid: API_KEY_SID,
          appSid: TWIML_APP_SID,
          identity,
        },
      });
    }

    return NextResponse.json({ token: jwtToken });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err?.message || String(err) },
      { status: 500 }
    );
  }
}
