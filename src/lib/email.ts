import { SITE_URL, SITE_NAME } from "./site";

/**
 * Email via Resend (https://resend.com) — transactional + broadcast in one
 * API, good deliverability, simple double-opt-in support. Swappable: only
 * this file talks to the provider.
 *
 * Honesty contract: if RESEND_API_KEY is missing we throw
 * EmailNotConfiguredError. Callers surface that state truthfully — we never
 * simulate a sent email.
 */
export class EmailNotConfiguredError extends Error {
  constructor() {
    super("Email provider not configured (RESEND_API_KEY missing)");
  }
}

const FROM = process.env.EMAIL_FROM ?? "NADC <alerts@mail.nadc.info>";

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(opts: { to: string; subject: string; html: string; text?: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new EmailNotConfiguredError();
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [opts.to], subject: opts.subject, html: opts.html, text: opts.text }),
  });
  if (!res.ok) {
    throw new Error(`Resend error ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as { id: string };
}

// CAN-SPAM: every marketing email must carry a physical postal address and a
// working unsubscribe link. ORG_POSTAL_ADDRESS must be set before sending
// real campaigns — see GO_LIVE_CHECKLIST.md.
function footer(unsubscribeUrl?: string): string {
  const address = process.env.ORG_POSTAL_ADDRESS ?? "[SET ORG_POSTAL_ADDRESS — required by CAN-SPAM]";
  return `
  <hr style="border:none;border-top:1px solid #ddd;margin:24px 0" />
  <p style="font-size:12px;color:#777;line-height:1.5">
    ${SITE_NAME} · ${address}<br/>
    ${unsubscribeUrl ? `<a href="${unsubscribeUrl}" style="color:#777">Unsubscribe</a> · ` : ""}
    <a href="${SITE_URL}/privacy" style="color:#777">Privacy policy</a>
  </p>`;
}

export async function sendConfirmOptInEmail(to: string, confirmToken: string) {
  const url = `${SITE_URL}/subscribe/confirm?token=${confirmToken}`;
  return sendEmail({
    to,
    subject: "Confirm your NADC subscription",
    html: `
      <p>You (or someone using this address) asked to receive alerts from ${SITE_NAME}.</p>
      <p><a href="${url}" style="display:inline-block;background:#00469C;color:#fff;padding:12px 20px;text-decoration:none;border-radius:2px">Confirm subscription</a></p>
      <p>If you didn't request this, ignore this email and you will not be subscribed.</p>
      ${footer()}`,
    text: `Confirm your NADC subscription: ${url}\n\nIf you didn't request this, ignore this email.`,
  });
}

export async function sendTipConfirmation(to: string) {
  return sendEmail({
    to,
    subject: "We received your tip — Neighbors Against Data Centers",
    html: `
      <p>Thank you. Your report is in our review queue.</p>
      <p>Every tracker entry is verified against public records before publication, so there may be a short delay
      while we confirm details. If we need more information we'll reply to this address.</p>
      <p>Your contact information is treated as sensitive and is never published.</p>
      ${footer()}`,
  });
}

export async function sendAdminNotification(subject: string, html: string) {
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!to) return;
  try {
    await sendEmail({ to, subject: `[NADC admin] ${subject}`, html });
  } catch (err) {
    console.error("admin notification failed:", err);
  }
}

export async function sendMagicLinkEmail(to: string, url: string) {
  return sendEmail({
    to,
    subject: "Your NADC admin sign-in link",
    html: `
      <p>Click to sign in to the NADC admin panel. This link expires in 15 minutes and can be used once.</p>
      <p><a href="${url}" style="display:inline-block;background:#00469C;color:#fff;padding:12px 20px;text-decoration:none;border-radius:2px">Sign in</a></p>
      <p>If you didn't request this, you can safely ignore it.</p>`,
    text: `Sign in to NADC admin (expires in 15 minutes): ${url}`,
  });
}
