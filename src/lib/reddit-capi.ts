import { createHash } from "node:crypto";

/**
 * Reddit Conversions API (server-side events). Sends our two key conversions —
 * a confirmed email (SignUp) and a completed donation (Purchase) — directly
 * from the backend, which is ad-blocker-proof and higher-fidelity than the
 * browser pixel alone (Reddit cites ~15% campaign lift for pixel + CAPI).
 *
 * Dedup with the pixel: each event carries a shared `conversion_id`. The pixel
 * fires the same event with the same id (`conversionId`), and Reddit collapses
 * the pair so conversions aren't double-counted.
 *
 * Honesty contract: inert (no-op, returns false) unless REDDIT_CONVERSIONS_TOKEN
 * and REDDIT_AD_ACCOUNT_ID are set. Best-effort — never throws into the
 * caller's flow (a failed ad-tracking call must not break a signup or donation).
 *
 * Test first: set REDDIT_CAPI_TEST_MODE=true, trigger a conversion, and confirm
 * it appears under Events Manager → Test Events. Then unset it to count for real.
 */
export function redditCapiConfigured(): boolean {
  return Boolean(process.env.REDDIT_CONVERSIONS_TOKEN && process.env.REDDIT_AD_ACCOUNT_ID);
}

/** SHA-256 of a normalized (trimmed, lowercased) string, hex-encoded — Reddit's PII format. */
function hashPii(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export type RedditConversionInput = {
  trackingType: "SignUp" | "Purchase" | "Lead" | "PageVisit";
  conversionId: string; // shared with the pixel for dedup
  clickId?: string | null; // rdt_cid from the ad landing URL
  uuid?: string | null; // _rdt_uuid cookie value
  email?: string | null; // raw — hashed here
  ipAddress?: string | null; // raw — hashed here
  userAgent?: string | null;
  valueDecimal?: number; // e.g. 15.00
  currency?: string; // e.g. "USD"
};

/** Sends one conversion event. Returns true if accepted, false if skipped/failed. */
export async function sendRedditConversion(input: RedditConversionInput): Promise<boolean> {
  const token = process.env.REDDIT_CONVERSIONS_TOKEN;
  const accountId = process.env.REDDIT_AD_ACCOUNT_ID;
  if (!token || !accountId) return false;

  // Reddit requires at least one attribution signal to match the event to a user.
  const user: Record<string, string> = {};
  if (input.email) user.email = hashPii(input.email);
  if (input.ipAddress) user.ip_address = hashPii(input.ipAddress);
  if (input.userAgent) user.user_agent = input.userAgent; // not hashed
  if (input.uuid) user.uuid = input.uuid; // _rdt_uuid cookie — not hashed
  const hasSignal = Boolean(input.clickId || input.uuid || input.email);
  if (!hasSignal) return false; // nothing to match on — don't send a useless event

  const event: Record<string, unknown> = {
    event_at: new Date().toISOString(),
    event_type: { tracking_type: input.trackingType },
    event_metadata: {
      conversion_id: input.conversionId,
      ...(input.valueDecimal != null ? { value_decimal: input.valueDecimal, currency: input.currency ?? "USD" } : {}),
    },
    user,
  };
  if (input.clickId) event.click_id = input.clickId;

  const body = {
    test_mode: process.env.REDDIT_CAPI_TEST_MODE === "true",
    events: [event],
  };

  try {
    const res = await fetch(`https://ads-api.reddit.com/api/v2.0/conversions/events/${accountId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "nadc.info-capi",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(`Reddit CAPI ${input.trackingType} failed ${res.status}: ${(await res.text()).slice(0, 300)}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Reddit CAPI ${input.trackingType} error:`, err);
    return false;
  }
}
