/**
 * SMS via Twilio Messaging Service. Requires completed A2P 10DLC brand +
 * campaign registration before any message will deliver — see
 * GO_LIVE_CHECKLIST.md. STOP/HELP keywords are handled by Twilio's Advanced
 * Opt-Out at the messaging-service level AND mirrored into our database via
 * the inbound webhook (/api/sms/inbound) so our records stay authoritative.
 *
 * Honesty contract: if Twilio env vars are missing we throw
 * SmsNotConfiguredError — we never simulate a sent message.
 */
export class SmsNotConfiguredError extends Error {
  constructor() {
    super("SMS provider not configured (TWILIO_* env vars missing)");
  }
}

export function smsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_MESSAGING_SERVICE_SID
  );
}

export async function sendSms(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const service = process.env.TWILIO_MESSAGING_SERVICE_SID;
  if (!sid || !token || !service) throw new SmsNotConfiguredError();

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, MessagingServiceSid: service, Body: body }),
  });
  if (!res.ok) throw new Error(`Twilio error ${res.status}: ${await res.text()}`);
  return (await res.json()) as { sid: string };
}

// Compliance: the very first message must identify the sender, state message
// frequency, note "Msg & data rates may apply", and give STOP/HELP keywords.
export async function sendSmsOptInConfirmation(to: string) {
  return sendSms(
    to,
    "NADC (Neighbors Against Data Centers): You're subscribed to data center alerts. Msg frequency varies; may increase before hearings/votes. Msg & data rates may apply. Reply HELP for help, STOP to cancel."
  );
}
