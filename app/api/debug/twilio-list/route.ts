// app/api/debug/twilio-list/route.ts
import { NextResponse } from 'next/server';

export const runtime   = 'nodejs';        // don't run at edge
export const dynamic   = 'force-dynamic'; // don't prerender
export const revalidate = 0;              // never cache

export async function GET() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID ?? '';
  const apiKeySid  = process.env.TWILIO_API_KEY_SID ?? '';
  const apiSecret  = process.env.TWILIO_API_SECRET ?? '';

  // If any env is missing, respond with a helpful error instead of crashing
  if (!accountSid || !apiKeySid || !apiSecret) {
    return NextResponse.json(
      {
        ok: false,
        reason: 'Missing Twilio env in runtime',
        have: {
          accountSid: accountSid || '(empty)',
          apiKeySidFirst6: (apiKeySid as any)?.slice?.(0, 6) ?? '(empty)',
          apiSecretPresent: !!apiSecret,
        },
      },
      { status: 500 }
    );
  }

  const auth = Buffer.from(`${apiKeySid}:${apiSecret}`).toString('base64');
  const url  = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Applications.json`;

  const r = await fetch(url, {
    headers: { Authorization: `Basic ${auth}` },
    cache: 'no-store', // avoid caching at the platform
  });

  const j = await r.json();

  // Trim response to essentials so it's easy to eyeball
  const apps = (j.applications || []).map((a: any) => ({
    sid: a.sid,
    friendlyName: a.friendly_name,
    voiceUrl: a.voice_url,
  }));

  return NextResponse.json({
    ok: true,
    accountSid,
    usingKey: apiKeySid.slice(0, 6) + '…',
    count: apps.length,
    apps,
  });
}
