import twilio, { jwt as TwilioJwt } from "twilio";


// REST client (server → Twilio) must use AUTH TOKEN, not API Secret
export const twilioClient = twilio(
process.env.TWILIO_ACCOUNT_SID!,
process.env.TWILIO_AUTH_TOKEN!
);


export function companyToCallerId(company: string) {
if (company === "connectiv") return process.env.COMPANY_CONNECTIV_NUMBER!;
if (company === "booksnpayroll") return process.env.COMPANY_BOOKSNPAYROLL_NUMBER!;
throw new Error("Unknown company");
}


export function createVoiceToken(identity: string) {
const AccessToken = TwilioJwt.AccessToken;
const VoiceGrant = TwilioJwt.AccessToken.VoiceGrant;


const token = new AccessToken(
process.env.TWILIO_ACCOUNT_SID!,
process.env.TWILIO_API_KEY!,
process.env.TWILIO_API_SECRET!,
{ identity }
);


const grant = new VoiceGrant({
outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID!,
incomingAllow: true,
});


token.addGrant(grant);
return token.toJwt();
}