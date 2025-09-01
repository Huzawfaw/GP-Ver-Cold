import { NextResponse } from 'next/server';

export async function GET() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const apiKeySid  = process.env.TWILIO_API_KEY_SID!;
  const apiSecret  = process.env.TWILIO_API_SECRET!;

  const auth = Buffer.from(`${apiKeySid}:${apiSecret}`).toString('base64');
  const url  = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Applications.json`;

  const r = await fetch(url, { headers: { Authorization: `Basic ${auth}` }});
  const j = await r.json();

  // Return just the SIDs and FriendlyNames so it's easy to eyeball
  const apps = (j.applications || []).map((a: any) => ({
    sid: a.sid, friendlyName: a.friendly_name, voiceUrl: a.voice_url
  }));

  return NextResponse.json({
    accountSid,
    usingKey: apiKeySid.slice(0,6) + '…',
    count: apps.length,
    apps
  });
}
