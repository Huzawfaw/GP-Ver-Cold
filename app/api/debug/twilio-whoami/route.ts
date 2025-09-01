import { NextResponse } from 'next/server';
import twilio from 'twilio';

export const runtime = 'nodejs';

function must(v: string | undefined, name: string) {
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function GET() {
  try {
    const AC = must(process.env.TWILIO_ACCOUNT_SID, 'TWILIO_ACCOUNT_SID');
    const AP =
      process.env.TWILIO_TWIML_APP_SID || process.env.TWILIO_APP_SID || '';
    if (!AP) throw new Error('Missing env: TWILIO_TWIML_APP_SID / TWILIO_APP_SID');

    const SK =
      process.env.TWILIO_API_KEY_SID || process.env.TWILIO_API_KEY || '';
    const SECRET = must(process.env.TWILIO_API_SECRET, 'TWILIO_API_SECRET');

    const client = twilio(SK, SECRET, { accountSid: AC });

    const app = await client.applications(AP).fetch();

    return NextResponse.json({
      ok: true,
      accountSid: AC,
      appSid: AP,
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
