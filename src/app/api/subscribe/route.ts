import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { subscribers, consentEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { clientIp, hashIp, rateLimit, verifyTurnstile, randomToken } from "@/lib/security";
import { sendConfirmOptInEmail, emailConfigured, EmailNotConfiguredError } from "@/lib/email";
import { sendSmsOptInConfirmation, smsConfigured } from "@/lib/sms";

const SMS_CONSENT_LANGUAGE =
  "I agree to receive recurring automated text alerts from Neighbors Against Data Centers about data center projects, hearings, and votes at the number provided. Consent is not a condition of any purchase. Message frequency varies. Msg & data rates may apply. Reply HELP for help, STOP to cancel.";

const subscribeSchema = z.object({
  email: z.string().email().max(320),
  phone: z
    .string()
    .regex(/^\+?[0-9 ()-]{10,20}$/)
    .optional(),
  smsConsent: z.boolean().default(false),
  preferences: z
    .object({
      national: z.boolean().default(true),
      states: z.array(z.string().length(2)).max(50).default([]),
      zips: z.array(z.string().regex(/^\d{5}$/)).max(20).default([]),
      projectIds: z.array(z.number().int()).max(100).default([]),
    })
    .default({ national: true, states: [], zips: [], projectIds: [] }),
  turnstileToken: z.string().nullable().optional(),
  website: z.string().optional(), // honeypot
  attribution: z
    .object({
      source: z.string().max(120).optional(),
      medium: z.string().max(120).optional(),
      campaign: z.string().max(120).optional(),
      content: z.string().max(120).optional(),
      term: z.string().max(120).optional(),
      landing: z.string().max(200).optional(),
      ts: z.string().max(40).optional(),
    })
    .nullable()
    .optional(),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const ipHash = hashIp(ip);

  if (!(await rateLimit(`subscribe:${ipHash}`, 10, 3600))) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
  }
  const data = parsed.data;

  if (data.website) return NextResponse.json({ ok: true, message: "Check your inbox to confirm." });

  if (!(await verifyTurnstile(data.turnstileToken ?? null, ip))) {
    return NextResponse.json({ error: "Bot check failed. Please reload and try again." }, { status: 400 });
  }

  // Honesty contract: double opt-in requires a working ESP. Without one we
  // cannot complete a compliant signup, so we say so rather than quietly
  // storing addresses that will never get a confirmation link.
  if (!emailConfigured()) {
    return NextResponse.json(
      { error: "Subscriptions aren't live yet — the email provider is not configured. Please check back soon." },
      { status: 503 }
    );
  }

  const email = data.email.toLowerCase().trim();
  const phone = data.phone ? normalizePhone(data.phone) : null;
  const confirmToken = randomToken();
  const expires = new Date(Date.now() + 48 * 3600 * 1000);

  const existing = await db.select().from(subscribers).where(eq(subscribers.email, email)).limit(1);

  let subscriberId: number;
  if (existing[0]) {
    // Refresh preferences; re-pend confirmation only if not already confirmed.
    const sub = existing[0];
    subscriberId = sub.id;
    await db
      .update(subscribers)
      .set({
        preferences: mergePreferences(sub.preferences, data.preferences),
        phone: phone ?? sub.phone,
        emailStatus: sub.emailStatus === "confirmed" ? "confirmed" : "pending",
        smsStatus: phone && data.smsConsent ? (sub.smsStatus === "confirmed" ? "confirmed" : "pending") : sub.smsStatus,
        confirmToken: sub.emailStatus === "confirmed" ? sub.confirmToken : confirmToken,
        confirmTokenExpiresAt: sub.emailStatus === "confirmed" ? sub.confirmTokenExpiresAt : expires,
        updatedAt: new Date(),
      })
      .where(eq(subscribers.id, sub.id));
    if (sub.emailStatus === "confirmed") {
      return NextResponse.json({ ok: true, message: "You're already subscribed — preferences updated." });
    }
  } else {
    const [row] = await db
      .insert(subscribers)
      .values({
        email,
        phone,
        emailStatus: "pending",
        smsStatus: phone && data.smsConsent ? "pending" : null,
        preferences: data.preferences,
        confirmToken,
        confirmTokenExpiresAt: expires,
        unsubscribeToken: randomToken(),
        attribution: data.attribution ?? null,
      })
      .returning({ id: subscribers.id });
    subscriberId = row.id;
  }

  await db.insert(consentEvents).values({
    subscriberId,
    channel: "email",
    action: "signup",
    detail: `Web signup; preferences=${JSON.stringify(data.preferences)}`,
    ipHash,
  });
  if (phone && data.smsConsent) {
    await db.insert(consentEvents).values({
      subscriberId,
      channel: "sms",
      action: "signup",
      detail: SMS_CONSENT_LANGUAGE,
      ipHash,
    });
  }

  try {
    await sendConfirmOptInEmail(email, confirmToken);
  } catch (err) {
    if (err instanceof EmailNotConfiguredError) {
      return NextResponse.json({ error: "Subscriptions aren't live yet. Please check back soon." }, { status: 503 });
    }
    console.error("opt-in email failed:", err);
    return NextResponse.json({ error: "We couldn't send the confirmation email. Please try again." }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    message: "Almost done — check your inbox and click the confirmation link to activate your subscription.",
  });
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits;
}

type Prefs = { national: boolean; states: string[]; zips: string[]; projectIds: number[] };
function mergePreferences(a: Prefs, b: Prefs): Prefs {
  return {
    national: a.national || b.national,
    states: [...new Set([...a.states, ...b.states])],
    zips: [...new Set([...a.zips, ...b.zips])],
    projectIds: [...new Set([...a.projectIds, ...b.projectIds])],
  };
}
