import { NextResponse } from 'next/server';
import twilio from 'twilio';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const API_KEY_SID =
    process.env.TWILIO_API_KEY_SID || process.env.TWILIO_API_KEY;
  const API_KEY_SECRET =
    process.env.TWILIO_API_KEY_SECRET || process.env.TWILIO_API_SECRET;
  const APP_SID =
    process.env.TWILIO_APP_SID || process.env.TWILIO_TWIML_APP_SID;

  if (!ACCOUNT_SID || !API_KEY_SID || !API_KEY_SECRET || !APP_SID) {
    return NextResponse.json(
      { ok: false, error: 'missing_env', ACCOUNT_SID, API_KEY_SID, APP_SID },
      { status: 500 }
    );
  }

  try {
    // Use the same creds you sign the token with
    const client = twilio(API_KEY_SID, API_KEY_SECRET, { accountSid: ACCOUNT_SID });

    // Try to fetch the TwiML App with these creds
    const app = await client.api.v2010
      .accounts(ACCOUNT_SID)
      .applications(APP_SID)
      .fetch();

    return NextResponse.json({
      ok: true,
      fetched: {
        appSid: app.sid,
        ownerAccountSid: app.accountSid,
        friendlyName: app.friendlyName,
      },
      note: 'ownerAccountSid must equal TWILIO_ACCOUNT_SID',
    });
  } catch (e: any) {
    // 401 => wrong key/secret for this account
    // 404 => app SID not in this account
    return NextResponse.json(
      {
        ok: false,
        message: e?.message,
        code: e?.code,
        status: e?.status,
        moreInfo: e?.moreInfo,
      },
      { status: 500 }
    );
  }
}
