"use client";

import { useState } from "react";
import Turnstile from "./Turnstile";
import { US_STATES } from "@/lib/site";

type Status = { kind: "idle" } | { kind: "submitting" } | { kind: "ok"; message: string } | { kind: "error"; message: string };

export default function TipForm() {
  const [form, setForm] = useState({
    reporterName: "",
    reporterEmail: "",
    locationText: "",
    state: "",
    zip: "",
    message: "",
    links: "",
    consent: false,
    website: "", // honeypot
  });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "submitting" });
    try {
      const res = await fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          links: form.links
            .split(/\s+/)
            .map((l) => l.trim())
            .filter((l) => /^https?:\/\//.test(l))
            .slice(0, 10),
          turnstileToken,
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
      <div className="card p-8 border-primary/30 bg-primary/5" role="status">
        <h2 className="font-display text-2xl text-primary mb-2">Thank you.</h2>
        <p className="font-body text-sm text-slate-600">{status.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5" aria-label="Report a proposed data center">
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>
          Leave this field empty
          <input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set("website", e.target.value)} />
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <label>
          <span className="label">Your name (optional)</span>
          <input type="text" className="input" value={form.reporterName} onChange={(e) => set("reporterName", e.target.value)} autoComplete="name" />
        </label>
        <label>
          <span className="label">
            Email <span className="text-accent">*</span>
          </span>
          <input
            type="email"
            required
            className="input"
            value={form.reporterEmail}
            onChange={(e) => set("reporterEmail", e.target.value)}
            autoComplete="email"
            aria-describedby="email-note"
          />
          <span id="email-note" className="font-body text-xs text-slate-400">
            Only used if we need to follow up. Never published.
          </span>
        </label>
      </div>

      <label>
        <span className="label">
          Where is the project? <span className="text-accent">*</span>
        </span>
        <input
          type="text"
          required
          className="input"
          placeholder="Address, city, or county"
          value={form.locationText}
          onChange={(e) => set("locationText", e.target.value)}
        />
      </label>

      <div className="grid sm:grid-cols-2 gap-5">
        <label>
          <span className="label">State</span>
          <select className="input" value={form.state} onChange={(e) => set("state", e.target.value)}>
            <option value="">Select a state…</option>
            {Object.entries(US_STATES).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">ZIP code</span>
          <input type="text" inputMode="numeric" pattern="[0-9]{5}" className="input" value={form.zip} onChange={(e) => set("zip", e.target.value)} autoComplete="postal-code" />
        </label>
      </div>

      <label>
        <span className="label">
          What do you know? <span className="text-accent">*</span>
        </span>
        <textarea
          required
          minLength={10}
          rows={6}
          className="input"
          placeholder="What have you seen or heard? Rezoning notices, developer names, parcel numbers, meeting dates — anything helps."
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
        />
      </label>

      <label>
        <span className="label">Links (news articles, filings, agendas)</span>
        <textarea
          rows={2}
          className="input"
          placeholder="One URL per line"
          value={form.links}
          onChange={(e) => set("links", e.target.value)}
        />
      </label>

      <label className="flex items-start gap-2 font-body text-sm text-slate-600">
        <input type="checkbox" required checked={form.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-1" />
        <span>
          I consent to NADC storing this report and contacting me about it. My identity will not be published. See the{" "}
          <a href="/privacy" className="underline text-primary">
            privacy policy
          </a>
          . <span className="text-accent">*</span>
        </span>
      </label>

      <Turnstile onToken={setTurnstileToken} />

      {status.kind === "error" && (
        <p className="font-body text-sm text-accent-dark" role="alert">
          {status.message}
        </p>
      )}

      <button type="submit" className="btn-accent" disabled={status.kind === "submitting"}>
        {status.kind === "submitting" ? "Submitting…" : "Submit Tip"}
      </button>
    </form>
  );
}
