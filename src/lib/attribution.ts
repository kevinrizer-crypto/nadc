"use client";

/**
 * First-touch marketing attribution. On the first page a visitor lands on, we
 * capture any utm_* params and stash them for 30 days. When they later confirm
 * an email or donate, the stored attribution is sent along and recorded in the
 * database — closing the loop from ad click → subscriber → donor.
 *
 * First-touch (not last-touch): the original ad that brought them in gets
 * credit, which is what we want for judging acquisition channels.
 */
export type Attribution = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  landing?: string;
  ts?: string;
  rdtCid?: string; // Reddit click ID (rdt_cid) — server-side conversion match key
  rdtUuid?: string; // _rdt_uuid cookie set by the pixel — server-side match key
};

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : undefined;
}

const KEY = "nadc_attribution";
const MAX_AGE_DAYS = 30;

/** Call once on app load. Captures UTMs if present and not already stored. */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(KEY)) return; // first-touch wins — don't overwrite

    const p = new URLSearchParams(window.location.search);
    const get = (k: string) => p.get(k) ?? undefined;
    const utm = {
      source: get("utm_source"),
      medium: get("utm_medium"),
      campaign: get("utm_campaign"),
      content: get("utm_content"),
      term: get("utm_term"),
    };
    const rdtCid = get("rdt_cid");
    // Store if this was a tagged visit OR carried a Reddit click ID.
    if (!utm.source && !rdtCid) return;

    const attribution: Attribution = {
      ...utm,
      rdtCid,
      landing: window.location.pathname,
      ts: new Date().toISOString(),
    };
    localStorage.setItem(KEY, JSON.stringify({ a: attribution, exp: Date.now() + MAX_AGE_DAYS * 864e5 }));
  } catch {
    /* private mode / storage disabled — attribution is best-effort */
  }
}

/** Returns stored attribution (or null) for inclusion in signup/donation calls. */
export function getAttribution(): Attribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { a: Attribution; exp: number };
    if (Date.now() > parsed.exp) {
      localStorage.removeItem(KEY);
      return null;
    }
    // Augment with the _rdt_uuid cookie at read time — the pixel sets it after
    // landing, so it may not have existed when attribution was first captured.
    const rdtUuid = readCookie("_rdt_uuid");
    return rdtUuid ? { ...parsed.a, rdtUuid } : parsed.a;
  } catch {
    return null;
  }
}
