"use client";

import { useState } from "react";
import Turnstile from "./Turnstile";

type Status = { kind: "idle" } | { kind: "submitting" } | { kind: "ok"; message: string } | { kind: "error"; message: string };

export default function PetitionSignForm({ petitionId }: { petitionId: number }) {
  const [form, setForm] = useState({ name: "", email: "", zip: "", comment: "", displayPublicly: false, subscribe: false, website: "" });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "submitting" });
    try {
      const res = await fetch("/api/petitions/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ petitionId, ...form, turnstileToken }),
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

  return (
    <form onSubmit={submit} className="card p-6 space-y-4" aria-label="Sign this petition">
      <h2 className="font-display text-2xl text-primary">Add your name</h2>

      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>
          Leave this field empty
          <input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set("website", e.target.value)} />
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <label>
          <span className="label">
            Full name <span className="text-accent">*</span>
          </span>
          <input type="text" required className="input" value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" />
        </label>
        <label>
          <span className="label">
            Email <span className="text-accent">*</span>
          </span>
          <input type="email" required className="input" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
        </label>
      </div>
      <label className="block sm:w-40">
        <span className="label">ZIP code</span>
        <input type="text" inputMode="numeric" pattern="[0-9]{5}" className="input" value={form.zip} onChange={(e) => set("zip", e.target.value)} autoComplete="postal-code" />
      </label>
      <label className="block">
        <span className="label">Comment (optional)</span>
        <textarea rows={3} className="input" value={form.comment} onChange={(e) => set("comment", e.target.value)} />
      </label>
      <label className="flex items-start gap-2 font-body text-sm text-slate-600">
        <input type="checkbox" checked={form.displayPublicly} onChange={(e) => set("displayPublicly", e.target.checked)} className="mt-1" />
        <span>Display my first name, last initial, and town on the public signature list.</span>
      </label>
      <label className="flex items-start gap-2 font-body text-sm text-slate-600">
        <input type="checkbox" checked={form.subscribe} onChange={(e) => set("subscribe", e.target.checked)} className="mt-1" />
        <span>Also subscribe me to The Grid and alerts about this project (double opt-in — we&apos;ll send a confirmation email).</span>
      </label>

      <Turnstile onToken={setTurnstileToken} />

      {status.kind === "error" && (
        <p className="font-body text-sm text-accent-dark" role="alert">
          {status.message}
        </p>
      )}

      <button type="submit" className="btn-accent" disabled={status.kind === "submitting"}>
        {status.kind === "submitting" ? "Signing…" : "Sign the petition"}
      </button>
      <p className="font-body text-xs text-slate-400">
        Your email is used to validate your signature and is never published or sold.
      </p>
    </form>
  );
}
