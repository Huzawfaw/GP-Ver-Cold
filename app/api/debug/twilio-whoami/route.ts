// app/api/debug/twilio-whoami/route.ts
import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { getTwilioEnv } from '@/lib/twilioEnv';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const env = getTwilioEnv();
    if (env.missing.length) {
      return NextResponse.json(
        { ok: false, message: `Missing env: ${env.missing.join(', ')}` },
        { status: 500 }
      );
    }

    const client = twilio(env.API_KEY_SID!, env.API_KEY_SECRET!, { accountSid: env.ACCOUNT_SID! });
    const app = await client.applications(env.APP_SID!).fetch();

    return NextResponse.json({
      ok: true,
      accountSid: env.ACCOUNT_SID,
      appSid: env.APP_SID,
      fetched: {
        sid: app.sid,
        friendlyName: app.friendlyName,
        accountSid: app.accountSid,
        voiceUrl: app.voiceUrl,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        message: err?.message || String(err),
        code: err?.code,
        status: err?.status,
        moreInfo: err?.moreInfo,
      },
      { status: 200 }
    );
  }
}
