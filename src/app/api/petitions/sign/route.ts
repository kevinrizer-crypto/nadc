import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { petitions, petitionSignatures, subscribers, consentEvents } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { clientIp, hashIp, rateLimit, verifyTurnstile, randomToken } from "@/lib/security";
import { sendConfirmOptInEmail, emailConfigured } from "@/lib/email";

const signSchema = z.object({
  petitionId: z.number().int(),
  name: z.string().min(2).max(200),
  email: z.string().email().max(320),
  zip: z.string().regex(/^\d{5}$/).optional().or(z.literal("")),
  comment: z.string().max(2000).optional(),
  displayPublicly: z.boolean().default(false),
  subscribe: z.boolean().default(false),
  turnstileToken: z.string().nullable().optional(),
  website: z.string().optional(), // honeypot
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const ipHash = hashIp(ip);

  if (!(await rateLimit(`petition:${ipHash}`, 10, 3600))) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = signSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
  const data = parsed.data;

  if (data.website) return NextResponse.json({ ok: true, message: "Thank you for signing." });

  if (!(await verifyTurnstile(data.turnstileToken ?? null, ip))) {
    return NextResponse.json({ error: "Bot check failed. Please reload and try again." }, { status: 400 });
  }

  const petition = (await db.select().from(petitions).where(and(eq(petitions.id, data.petitionId), eq(petitions.active, true))).limit(1))[0];
  if (!petition) return NextResponse.json({ error: "This petition is not active." }, { status: 404 });

  const email = data.email.toLowerCase().trim();
  try {
    await db.insert(petitionSignatures).values({
      petitionId: petition.id,
      name: data.name.trim(),
      email,
      zip: data.zip || null,
      comment: data.comment?.trim() || null,
      displayPublicly: data.displayPublicly,
      ipHash,
    });
  } catch {
    // Unique (petitionId, email) violation → already signed.
    return NextResponse.json({ ok: true, message: "You've already signed this petition — thank you." });
  }

  // Optional subscription, still double opt-in: signing never auto-subscribes.
  let message = "Signature recorded — thank you.";
  if (data.subscribe && emailConfigured()) {
    const confirmToken = randomToken();
    const prefs = {
      national: true,
      states: [] as string[],
      zips: data.zip ? [data.zip] : [],
      projectIds: petition.projectId ? [petition.projectId] : [],
    };
    const existing = (await db.select().from(subscribers).where(eq(subscribers.email, email)).limit(1))[0];
    let subscriberId: number;
    if (existing) {
      subscriberId = existing.id;
      if (existing.emailStatus !== "confirmed") {
        await db
          .update(subscribers)
          .set({ confirmToken, confirmTokenExpiresAt: new Date(Date.now() + 48 * 3600 * 1000), emailStatus: "pending", updatedAt: new Date() })
          .where(eq(subscribers.id, existing.id));
      }
    } else {
      const [row] = await db
        .insert(subscribers)
        .values({
          email,
          emailStatus: "pending",
          preferences: prefs,
          confirmToken,
          confirmTokenExpiresAt: new Date(Date.now() + 48 * 3600 * 1000),
          unsubscribeToken: randomToken(),
        })
        .returning({ id: subscribers.id });
      subscriberId = row.id;
    }
    await db.insert(consentEvents).values({
      subscriberId,
      channel: "email",
      action: "signup",
      detail: `Petition signing opt-in (petition #${petition.id})`,
      ipHash,
    });
    if (!existing || existing.emailStatus !== "confirmed") {
      try {
        await sendConfirmOptInEmail(email, confirmToken);
        message = "Signature recorded. Check your inbox to confirm your subscription.";
      } catch (err) {
        console.error("petition opt-in email failed:", err);
      }
    }
  }

  return NextResponse.json({ ok: true, message });
}
