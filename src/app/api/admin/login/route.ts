import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminEmail, createLoginLink } from "@/lib/auth";
import { clientIp, hashIp, rateLimit } from "@/lib/security";
import { sendMagicLinkEmail, emailConfigured } from "@/lib/email";
import { SITE_URL } from "@/lib/site";

/**
 * Requests a magic sign-in link. Responds identically whether or not the
 * email is on the allowlist (no account enumeration). Tightly rate-limited.
 */
export async function POST(req: Request) {
  const ipHash = hashIp(clientIp(req));
  if (!(await rateLimit(`admin-login:${ipHash}`, 5, 900))) {
    return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = z.object({ email: z.string().email() }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });

  if (!emailConfigured()) {
    return NextResponse.json(
      { error: "Email provider not configured — set RESEND_API_KEY to enable admin login." },
      { status: 503 }
    );
  }

  const email = parsed.data.email.toLowerCase();
  if (await isAdminEmail(email)) {
    const url = await createLoginLink(email, SITE_URL);
    try {
      await sendMagicLinkEmail(email, url);
    } catch (err) {
      console.error("magic link email failed:", err);
      return NextResponse.json({ error: "Couldn't send the sign-in email. Try again." }, { status: 502 });
    }
  }

  // Same response either way.
  return NextResponse.json({ ok: true, message: "If that address is on the admin list, a sign-in link is on its way." });
}
