import { NextRequest, NextResponse } from 'next/server';
import { jwt as TwilioJwt } from 'twilio';
import { getTwilioEnv } from '@/lib/twilioEnv';

const { AccessToken } = TwilioJwt;
const { VoiceGrant } = AccessToken;

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const identity = url.searchParams.get('identity') ?? 'agent';
  const company  = url.searchParams.get('company') ?? 'connectiv';

  const env = getTwilioEnv();
  if (env.missing.length) {
    return NextResponse.json(
      { ok: false, reason: `Missing env: ${env.missing.join(', ')}` },
      { status: 500 }
    );
  }

  const token = new AccessToken(
    env.ACCOUNT_SID!,
    env.API_KEY_SID!,
    env.API_KEY_SECRET!,
    { identity }
  );

  const grant = new VoiceGrant({
    outgoingApplicationSid: env.APP_SID!,
    // optional: pass company to your TwiML app via params
    // outgoingApplicationParams: { company },
    incomingAllow: true,
  });

  token.addGrant(grant);

  return NextResponse.json({ token: token.toJwt() });
}
