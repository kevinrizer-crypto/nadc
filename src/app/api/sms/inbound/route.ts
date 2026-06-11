import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { db } from "@/db";
import { subscribers, consentEvents } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Twilio inbound-SMS webhook. Twilio's Advanced Opt-Out already enforces
 * STOP/HELP at the carrier level; this webhook mirrors those events into our
 * database so our consent records remain authoritative.
 *
 * Configure in Twilio: Messaging Service → Inbound Settings → webhook URL
 * https://nadc.info/api/sms/inbound (validated via X-Twilio-Signature).
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const params = new URLSearchParams(raw);

  // Validate Twilio signature (HMAC-SHA1 of URL + sorted params).
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (token) {
    const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://nadc.info"}/api/sms/inbound`;
    const sorted = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
    const payload = url + sorted.map(([k, v]) => k + v).join("");
    const expected = createHmac("sha1", token).update(payload).digest("base64");
    const given = req.headers.get("x-twilio-signature") ?? "";
    if (expected !== given) return new NextResponse("invalid signature", { status: 403 });
  } else {
    return new NextResponse("not configured", { status: 503 });
  }

  const from = params.get("From");
  const body = (params.get("Body") ?? "").trim().toUpperCase();
  if (!from) return new NextResponse("ok");

  const rows = await db.select().from(subscribers).where(eq(subscribers.phone, from)).limit(1);
  const sub = rows[0];

  if (sub && ["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"].includes(body)) {
    await db.update(subscribers).set({ smsStatus: "unsubscribed", updatedAt: new Date() }).where(eq(subscribers.id, sub.id));
    await db.insert(consentEvents).values({ subscriberId: sub.id, channel: "sms", action: "stop", detail: body });
  } else if (sub && body === "HELP") {
    await db.insert(consentEvents).values({ subscriberId: sub.id, channel: "sms", action: "help", detail: body });
  }

  // Twilio expects TwiML; empty response = no auto-reply (Twilio's own
  // opt-out handler sends the carrier-required confirmation).
  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    headers: { "Content-Type": "text/xml" },
  });
}
