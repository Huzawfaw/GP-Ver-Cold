// lib/twilioEnv.ts
export function getTwilioEnv() {
  const ACCOUNT_SID   = process.env.TWILIO_ACCOUNT_SID;
  const API_KEY_SID   = process.env.TWILIO_API_KEY_SID ?? process.env.TWILIO_API_KEY;
  const API_KEY_SECRET= process.env.TWILIO_API_KEY_SECRET ?? process.env.TWILIO_API_SECRET;
  const APP_SID       = process.env.TWILIO_TWIML_APP_SID ?? process.env.TWIML_APP_SID;

  const missing: string[] = [];
  if (!ACCOUNT_SID)    missing.push('TWILIO_ACCOUNT_SID');
  if (!API_KEY_SID)    missing.push('TWILIO_API_KEY_SID (or TWILIO_API_KEY)');
  if (!API_KEY_SECRET) missing.push('TWILIO_API_KEY_SECRET (or TWILIO_API_SECRET)');
  if (!APP_SID)        missing.push('TWILIO_TWIML_APP_SID');

  return { ACCOUNT_SID, API_KEY_SID, API_KEY_SECRET, APP_SID, missing };
}
