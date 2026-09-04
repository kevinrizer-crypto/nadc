"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * True when the client will attempt a bot check. This MUST stay in sync with
 * the server, which enforces whenever TURNSTILE_SECRET_KEY is set: if the
 * server enforces and the client never produces a token, every submission is
 * rejected with "Bot check failed".
 */
export const turnstileEnabled = Boolean(SITE_KEY);

export const TURNSTILE_FAILED_MESSAGE =
  "We couldn't complete the security check. Please complete the \u201cVerify you are human\u201d box, then try again.";

/** Shown once the auto-pass grace elapses and a human clearly has to tick the box. */
export const TURNSTILE_INTERACTION_MESSAGE =
  "Almost there \u2014 complete the \u201cVerify you are human\u201d check, and we\u2019ll continue automatically.";

/**
 * Token plumbing shared by every bot-checked form.
 *
 * The token is held in refs, not state: `awaitToken` reads it inside an async
 * loop where a state closure would be stale. It also fixes the submit-before-
 * challenge race — on mobile the widget frequently resolves *after* the user
 * has already tapped Submit, which would otherwise post a null token and be
 * rejected by the server.
 */
export function useTurnstileToken() {
  const tokenRef = useRef<string | null>(null);
  const errorRef = useRef<string | null>(null);

  const onToken = useCallback((token: string) => {
    tokenRef.current = token || null;
    if (token) errorRef.current = null;
  }, []);

  const onError = useCallback((code: string) => {
    errorRef.current = code;
  }, []);

  /**
   * Resolves the token, waiting out the widget. Null means the check failed.
   *
   * Production Turnstile shows an interactive "Verify you are human" checkbox to
   * a large share of visitors, so this wait has to outlast a human noticing the
   * widget and tapping it. A short timeout would fail people mid-challenge —
   * precisely the conversion loss this whole fix exists to stop. Auto-passing
   * visitors still resolve in well under the grace period, so they see nothing.
   */
  const awaitToken = useCallback(
    async ({
      graceMs = 2_500,
      timeoutMs = 120_000,
      onNeedsInteraction,
    }: { graceMs?: number; timeoutMs?: number; onNeedsInteraction?: () => void } = {}): Promise<string | null> => {
      if (!turnstileEnabled) return null;
      const start = Date.now();
      let notified = false;
      while (Date.now() - start < timeoutMs) {
        if (tokenRef.current) return tokenRef.current;
        if (errorRef.current) return null;
        if (!notified && Date.now() - start > graceMs) {
          notified = true;
          onNeedsInteraction?.();
        }
        await new Promise((r) => setTimeout(r, 150));
      }
      return null;
    },
    []
  );

  return { onToken, onError, awaitToken };
}

/**
 * Cloudflare Turnstile widget. Renders nothing when
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset (local dev) — the server mirrors
 * this by skipping verification only when its secret is unset.
 *
 * IMPORTANT: this must render on EVERY form the server bot-checks, including
 * the compact inline variants. A form that omits it can never obtain a token
 * and will be rejected 100% of the time.
 */
export default function Turnstile({
  onToken,
  onError,
  compact = false,
}: {
  onToken: (token: string) => void;
  onError?: (code: string) => void;
  compact?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  // Callbacks live in refs so a parent re-render never re-mounts the widget.
  const onTokenRef = useRef(onToken);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onTokenRef.current = onToken;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    if (!SITE_KEY || !ref.current) return;
    const tryRender = () => {
      if (window.turnstile && ref.current && !widgetId.current) {
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: SITE_KEY,
          callback: (token: string) => onTokenRef.current(token),
          // Surface hard failures (bad sitekey, blocked challenge) instead of
          // leaving the form waiting for a token that will never arrive.
          "error-callback": (code: string) => {
            onErrorRef.current?.(String(code));
            return true;
          },
          "expired-callback": () => onTokenRef.current(""),
          // Inline forms stay visually clean: the widget only appears if
          // Cloudflare actually needs the visitor to interact.
          appearance: compact ? "interaction-only" : "always",
        });
      }
    };
    tryRender();
    const t = setInterval(tryRender, 500);
    return () => {
      clearInterval(t);
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [compact]);

  if (!SITE_KEY) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div ref={ref} />
    </>
  );
}
