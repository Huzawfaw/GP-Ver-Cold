import { NextResponse } from 'next/server';

const redact = (v?: string | null) =>
  v ? `${v.slice(0, 4)}…${v.slice(-4)}` : null;

export async function GET() {
  return NextResponse.json({
    TWILIO_ACCOUNT_SID: redact(process.env.TWILIO_ACCOUNT_SID),
    TWILIO_TWIML_APP_SID: redact(
      process.env.TWILIO_TWIML_APP_SID || process.env.TWILIO_APP_SID
    ),
    TWILIO_API_KEY_SID: redact(
      process.env.TWILIO_API_KEY_SID || process.env.TWILIO_API_KEY
    ),
    scope:
      process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown', // prod/preview/dev
  });
}
