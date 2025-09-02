import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { getTwilioEnv } from '@/lib/twilioEnv'; // use your helper

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const env = getTwilioEnv();
    if (env.missing.length) {
      return NextResponse.json({ ok: false, reason: `Missing env: ${env.missing.join(', ')}` }, { status: 500 });
    }

    // Authenticate with exactly the same creds your app uses
    const client = twilio(env.API_KEY_SID!, env.API_KEY_SECRET!, { accountSid: env.ACCOUNT_SID! });

    // 1) Which account does this key *really* access?
    const acct = await client.api.accounts(env.ACCOUNT_SID!).fetch(); // throws if not accessible

    // 2) What TwiML apps does this account see?
    const apps = await client.applications.list({ limit: 20 });
    const appSids = apps.map(a => ({ sid: a.sid, name: a.friendlyName }));

    // 3) If you set TWILIO_TWIML_APP_SID, try fetching it directly
    let fetchedApp: any = null;
    try {
      fetchedApp = await client.applications(env.APP_SID!).fetch();
    } catch (e: any) {
      fetchedApp = { error: e?.message, code: e?.code, status: e?.status, moreInfo: e?.moreInfo };
    }

    return NextResponse.json({
      ok: true,
      env: {
        accountSid: env.ACCOUNT_SID,
        apiKeySid: env.API_KEY_SID,
        appSid: env.APP_SID,
      },
      accountFetched: { sid: acct.sid, status: acct.status },
      appsCount: apps.length,
      apps: appSids,
      fetchedApp,
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      message: err?.message || String(err),
      code: err?.code,
      status: err?.status,
      moreInfo: err?.moreInfo,
    });
  }
}
