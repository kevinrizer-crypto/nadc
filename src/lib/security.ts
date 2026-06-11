import { createHash, randomBytes } from "node:crypto";
import { db } from "@/db";
import { rateLimits } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

/**
 * One-way hash of an IP for abuse triage. We never store raw IPs alongside
 * tips, signatures, or consent events — tipster identity is sensitive.
 */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "nadc";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export function clientIp(req: Request): string {
  // Behind Cloudflare, CF-Connecting-IP is authoritative.
  const h = (name: string) => (req.headers.get(name) ?? "").split(",")[0].trim();
  return h("cf-connecting-ip") || h("x-forwarded-for") || "0.0.0.0";
}

export function randomToken(): string {
  return randomBytes(32).toString("hex");
}

export function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

/**
 * DB-backed fixed-window rate limiter (works across serverless instances).
 * Returns true when the request is allowed.
 */
export async function rateLimit(bucket: string, limit: number, windowSeconds: number): Promise<boolean> {
  const windowStart = new Date(Math.floor(Date.now() / (windowSeconds * 1000)) * windowSeconds * 1000);
  const rows = await db
    .insert(rateLimits)
    .values({ bucket, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimits.bucket, rateLimits.windowStart],
      set: { count: sql`${rateLimits.count} + 1` },
    })
    .returning({ count: rateLimits.count });
  // Opportunistic cleanup of old windows (cheap, occasional).
  if (Math.random() < 0.02) {
    await db.delete(rateLimits).where(and(eq(rateLimits.bucket, bucket), sql`${rateLimits.windowStart} < now() - interval '1 day'`));
  }
  return (rows[0]?.count ?? 1) <= limit;
}

/**
 * Verifies a Cloudflare Turnstile token. If TURNSTILE_SECRET_KEY is not set
 * (local dev), verification is skipped with a console warning — production
 * must configure it (see GO_LIVE_CHECKLIST.md).
 */
export async function verifyTurnstile(token: string | null, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn("TURNSTILE_SECRET_KEY not set — skipping bot check (dev only)");
    return true;
  }
  if (!token) return false;
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, response: token, remoteip: ip }),
  });
  const data = (await res.json()) as { success: boolean };
  return data.success === true;
}
