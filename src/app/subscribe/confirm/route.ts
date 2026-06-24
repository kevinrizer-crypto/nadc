import { NextResponse } from "next/server";
import { db } from "@/db";
import { subscribers, consentEvents } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { clientIp, hashIp } from "@/lib/security";
import { sendSmsOptInConfirmation, smsConfigured } from "@/lib/sms";
import { sendRedditConversion } from "@/lib/reddit-capi";
import { SITE_URL } from "@/lib/site";

/**
 * Double opt-in confirmation endpoint (GET — arrives from the email link).
 * Confirms email; if the subscriber also gave SMS consent, sends the
 * compliance-required opt-in confirmation text.
 */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.redirect(`${SITE_URL}/subscribe?confirm=invalid`);

  const rows = await db
    .select()
    .from(subscribers)
    .where(and(eq(subscribers.confirmToken, token), gt(subscribers.confirmTokenExpiresAt, new Date())))
    .limit(1);
  const sub = rows[0];
  if (!sub) return NextResponse.redirect(`${SITE_URL}/subscribe?confirm=invalid`);

  await db
    .update(subscribers)
    .set({
      emailStatus: "confirmed",
      smsStatus: sub.smsStatus === "pending" ? "confirmed" : sub.smsStatus,
      confirmToken: null,
      confirmTokenExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(subscribers.id, sub.id));

  const ipHash = hashIp(clientIp(req));
  await db.insert(consentEvents).values({
    subscriberId: sub.id,
    channel: "email",
    action: "confirm",
    detail: "Double opt-in link clicked",
    ipHash,
  });

  if (sub.smsStatus === "pending" && sub.phone) {
    await db.insert(consentEvents).values({
      subscriberId: sub.id,
      channel: "sms",
      action: "confirm",
      detail: "Confirmed via email double opt-in",
      ipHash,
    });
    if (smsConfigured()) {
      try {
        await sendSmsOptInConfirmation(sub.phone);
      } catch (err) {
        console.error("SMS opt-in confirmation failed:", err);
      }
    }
  }

  // Reddit Conversions API (server-side SignUp). Shared conversion_id lets the
  // browser pixel on the redirect page dedup against this event.
  const conversionId = `signup_${sub.id}`;
  const attr = sub.attribution;
  await sendRedditConversion({
    trackingType: "SignUp",
    conversionId,
    clickId: attr?.rdtCid,
    uuid: attr?.rdtUuid,
    email: sub.email,
    ipAddress: clientIp(req),
    userAgent: req.headers.get("user-agent"),
  });

  return NextResponse.redirect(`${SITE_URL}/subscribe?confirm=ok&cid=${encodeURIComponent(conversionId)}`);
}
