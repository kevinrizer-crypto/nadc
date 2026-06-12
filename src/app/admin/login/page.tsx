"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(params.get("error") === "invalid" ? "That sign-in link is invalid or expired. Request a new one." : null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-24">
      <h1 className="font-display text-3xl text-primary mb-6">Admin sign-in</h1>
      {message ? (
        <div className="card p-6 border-primary/30 bg-primary/5" role="status">
          <p className="font-body text-sm text-ink">{message}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="card p-6 space-y-4">
          <label className="block">
            <span className="label">Email</span>
            <input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </label>
          {error && (
            <p className="font-body text-sm text-accent-dark" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "Sending…" : "Email me a sign-in link"}
          </button>
          <p className="font-body text-xs text-slate-400">
            Single-use link, 15-minute expiry. Access restricted to the staff allowlist.
          </p>
        </form>
      )}
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
