import { NextResponse } from "next/server";
import { db } from "@/db";
import { subscribers, consentEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { clientIp, hashIp } from "@/lib/security";
import { SITE_URL } from "@/lib/site";

/** One-click unsubscribe (CAN-SPAM). Token is per-subscriber and permanent. */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.redirect(`${SITE_URL}/subscribe?unsub=invalid`);

  const rows = await db.select().from(subscribers).where(eq(subscribers.unsubscribeToken, token)).limit(1);
  const sub = rows[0];
  if (!sub) return NextResponse.redirect(`${SITE_URL}/subscribe?unsub=invalid`);

  await db
    .update(subscribers)
    .set({ emailStatus: "unsubscribed", smsStatus: sub.smsStatus ? "unsubscribed" : null, updatedAt: new Date() })
    .where(eq(subscribers.id, sub.id));
  await db.insert(consentEvents).values({
    subscriberId: sub.id,
    channel: "email",
    action: "unsubscribe",
    detail: "One-click unsubscribe link",
    ipHash: hashIp(clientIp(req)),
  });

  return NextResponse.redirect(`${SITE_URL}/subscribe?unsub=ok`);
}
