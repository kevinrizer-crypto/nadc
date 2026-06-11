import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { tips } from "@/db/schema";
import { clientIp, hashIp, rateLimit, verifyTurnstile } from "@/lib/security";
import { sendTipConfirmation, sendAdminNotification, emailConfigured } from "@/lib/email";

const tipSchema = z.object({
  reporterName: z.string().max(200).optional(),
  reporterEmail: z.string().email().max(320),
  locationText: z.string().min(2).max(500),
  state: z.string().length(2).optional().or(z.literal("")),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/).optional().or(z.literal("")),
  message: z.string().min(10).max(8000),
  links: z.array(z.string().url().max(2000)).max(10).default([]),
  consent: z.literal(true),
  turnstileToken: z.string().nullable().optional(),
  website: z.string().optional(), // honeypot
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const ipHash = hashIp(ip);

  // 5 tips per hour per IP
  if (!(await rateLimit(`tips:${ipHash}`, 5, 3600))) {
    return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = tipSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form fields and try again." }, { status: 400 });
  }
  const data = parsed.data;

  // Honeypot: pretend success, store nothing.
  if (data.website) return NextResponse.json({ ok: true });

  if (!(await verifyTurnstile(data.turnstileToken ?? null, ip))) {
    return NextResponse.json({ error: "Bot check failed. Please reload and try again." }, { status: 400 });
  }

  const [tip] = await db
    .insert(tips)
    .values({
      reporterName: data.reporterName || null,
      reporterEmail: data.reporterEmail,
      locationText: data.locationText,
      state: data.state ? data.state.toUpperCase() : null,
      zip: data.zip || null,
      message: data.message,
      links: data.links,
      consent: true,
      submitterIpHash: ipHash,
    })
    .returning({ id: tips.id });

  // Confirmation + admin notice are best-effort: the tip is already safely
  // stored. If the ESP isn't configured we say so honestly in the response.
  let emailSent = false;
  if (emailConfigured()) {
    try {
      await sendTipConfirmation(data.reporterEmail);
      emailSent = true;
    } catch (err) {
      console.error("tip confirmation email failed:", err);
    }
    await sendAdminNotification(
      `New tip #${tip.id}`,
      `<p>Location: ${escapeHtml(data.locationText)}</p><p>${escapeHtml(data.message).slice(0, 500)}</p><p>Review it in the admin panel.</p>`
    );
  }

  return NextResponse.json({
    ok: true,
    message: emailSent
      ? "Tip received — check your inbox for a confirmation. Our team verifies every report before it joins the tracker."
      : "Tip received. Our team verifies every report before it joins the tracker.",
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
