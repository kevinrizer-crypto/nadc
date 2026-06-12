import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/db";
import { admins, loginTokens } from "@/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import { randomToken, sha256 } from "./security";

/**
 * Admin auth: email magic link against the admins allowlist.
 *
 * Flow: admin enters email → if allowlisted, a single-use token (stored
 * hashed, 15-min expiry) is emailed → exchanging it sets an HttpOnly,
 * Secure, SameSite=Lax session JWT (8h).
 *
 * Defense in depth for production: put /admin* behind Cloudflare Access
 * (free up to 50 users) which enforces its own SSO + 2FA before requests
 * reach the app. Documented in README and GO_LIVE_CHECKLIST.
 */

const SESSION_COOKIE = "nadc_admin";
const SESSION_HOURS = 8;

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

export async function isAdminEmail(email: string): Promise<boolean> {
  const rows = await db.select().from(admins).where(eq(admins.email, email.toLowerCase())).limit(1);
  return rows.length > 0;
}

/** Creates a single-use login token and returns the URL to email. */
export async function createLoginLink(email: string, baseUrl: string): Promise<string> {
  const token = randomToken();
  await db.insert(loginTokens).values({
    email: email.toLowerCase(),
    tokenHash: sha256(token),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });
  return `${baseUrl}/admin/login/verify?token=${token}`;
}

/** Consumes a login token; returns the admin email or null. */
export async function consumeLoginToken(token: string): Promise<string | null> {
  const rows = await db
    .select()
    .from(loginTokens)
    .where(and(eq(loginTokens.tokenHash, sha256(token)), isNull(loginTokens.usedAt), gt(loginTokens.expiresAt, new Date())))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  await db.update(loginTokens).set({ usedAt: new Date() }).where(eq(loginTokens.id, row.id));
  if (!(await isAdminEmail(row.email))) return null; // re-check allowlist at exchange time
  return row.email;
}

export async function createSession(email: string) {
  const jwt = await new SignJWT({ email, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(secret());
  const store = await cookies();
  store.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Returns the signed-in admin's email, or null. */
export async function getAdmin(): Promise<string | null> {
  const store = await cookies();
  const jwt = store.get(SESSION_COOKIE)?.value;
  if (!jwt) return null;
  try {
    const { payload } = await jwtVerify(jwt, secret());
    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}

/** Throws (redirect handled by caller) if not signed in. */
export async function requireAdmin(): Promise<string> {
  const email = await getAdmin();
  if (!email) throw new Error("UNAUTHORIZED");
  return email;
}
