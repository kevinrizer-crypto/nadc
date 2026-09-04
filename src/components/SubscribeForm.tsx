"use client";

import { useState } from "react";
import Turnstile, {
  TURNSTILE_FAILED_MESSAGE,
  TURNSTILE_INTERACTION_MESSAGE,
  turnstileEnabled,
  useTurnstileToken,
} from "./Turnstile";
import { getAttribution } from "@/lib/attribution";

type Status =
  | { kind: "idle" }
  | { kind: "verifying"; message?: string }
  | { kind: "submitting" }
  | { kind: "ok"; message: string }
  | { kind: "error"; message: string };

/**
 * Email + optional SMS signup with granular opt-in (national newsletter,
 * state alerts, ZIP alerts). Email uses double opt-in: this form only puts
 * the address in "pending" — nothing is sent to the list until the
 * confirmation link is clicked. SMS consent language is explicit per
 * 10DLC/TCPA requirements.
 */
export default function SubscribeForm({ compact = false, defaultZip = "" }: { compact?: boolean; defaultZip?: string }) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [zip, setZip] = useState(defaultZip);
  const [national, setNational] = useState(true);
  const [smsConsent, setSmsConsent] = useState(false);
  const [showSms, setShowSms] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [website, setWebsite] = useState(""); // honeypot

  const turnstile = useTurnstileToken();

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    let token: string | null = null;
    if (turnstileEnabled) {
      setStatus({ kind: "verifying" });
      token = await turnstile.awaitToken({
        onNeedsInteraction: () => setStatus({ kind: "verifying", message: TURNSTILE_INTERACTION_MESSAGE }),
      });
      if (!token) {
        setStatus({ kind: "error", message: TURNSTILE_FAILED_MESSAGE });
        return;
      }
    }

    setStatus({ kind: "submitting" });
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone: showSms && smsConsent ? phone : undefined,
          smsConsent: showSms && smsConsent,
          preferences: { national, states: [], zips: zip ? [zip] : [], projectIds: [] },
          turnstileToken: token,
          website,
          attribution: getAttribution(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setStatus({ kind: "ok", message: data.message });
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "Something went wrong." });
    }
  }

  if (status.kind === "ok") {
    return (
      <div className="card p-6 border-primary/30 bg-primary/5" role="status">
        <p className="font-body font-semibold text-primary">{status.message}</p>
      </div>
    );
  }

  const busy = status.kind === "submitting" || status.kind === "verifying";
  const buttonLabel = status.kind === "verifying" ? "Verifying…" : status.kind === "submitting" ? "Subscribing…" : "Subscribe";

  return (
    <form onSubmit={submit} className="space-y-3" aria-label="Subscribe to alerts">
      {/* Honeypot — hidden from real users, tab-skipped, bots fill it */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>
          Leave this field empty
          <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      <div className={compact ? "flex flex-col sm:flex-row gap-2" : "space-y-3"}>
        <label className="flex-1">
          <span className={compact ? "sr-only" : "label"}>Email address</span>
          <input
            type="email"
            required
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>
        <label className={compact ? "sm:w-36" : "block"}>
          <span className={compact ? "sr-only" : "label"}>ZIP code (optional — for local alerts)</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{5}"
            className="input"
            placeholder="ZIP (optional)"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            autoComplete="postal-code"
          />
        </label>
        {compact && (
          <button type="submit" className="btn-primary whitespace-nowrap" disabled={busy}>
            {buttonLabel}
          </button>
        )}
      </div>

      {!compact && (
        <>
          <label className="flex items-start gap-2 font-body text-sm text-slate-600">
            <input type="checkbox" checked={national} onChange={(e) => setNational(e.target.checked)} className="mt-1" />
            <span>
              The Grid — our national weekly roundup of project filings, hearings, and fight outcomes.
              {zip && " You'll also get alerts for projects near your ZIP."}
            </span>
          </label>

          {!showSms ? (
            <button type="button" className="font-body text-sm text-primary underline" onClick={() => setShowSms(true)}>
              Also get text alerts for urgent hearings →
            </button>
          ) : (
            <fieldset className="card p-4 space-y-3">
              <legend className="label">SMS alerts (optional)</legend>
              <label className="block">
                <span className="label">Mobile number</span>
                <input
                  type="tel"
                  className="input"
                  placeholder="+1 555 555 5555"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </label>
              <label className="flex items-start gap-2 font-body text-xs text-slate-600">
                <input type="checkbox" checked={smsConsent} onChange={(e) => setSmsConsent(e.target.checked)} className="mt-0.5" required={Boolean(phone)} />
                <span>
                  I agree to receive recurring automated text alerts from Neighbors Against Data Centers about data center
                  projects, hearings, and votes at the number provided. Consent is not a condition of any purchase. Message
                  frequency varies and may increase before hearings or votes. Msg &amp; data rates may apply. Reply HELP for
                  help, STOP to cancel. See our <a href="/consent-policy" className="underline">consent policy</a> and{" "}
                  <a href="/privacy" className="underline">privacy policy</a>.
                </span>
              </label>
            </fieldset>
          )}
        </>
      )}

      {/* The bot check must render for BOTH variants — the server rejects any
          submission without a token, compact or not. In compact mode it is
          interaction-only, so it stays invisible unless a challenge is needed. */}
      <Turnstile onToken={turnstile.onToken} onError={turnstile.onError} compact={compact} />

      {!compact && (
        <button type="submit" className="btn-primary" disabled={busy}>
          {buttonLabel}
        </button>
      )}

      {status.kind === "verifying" && status.message && (
        <p className="font-body text-sm text-primary" role="status">
          {status.message}
        </p>
      )}
      {status.kind === "error" && (
        <p className="font-body text-sm text-accent-dark" role="alert">
          {status.message}
        </p>
      )}
      <p className="font-body text-xs text-slate-400">
        Double opt-in: we&apos;ll send a confirmation link before you receive anything. Unsubscribe anytime.
      </p>
    </form>
  );
}
