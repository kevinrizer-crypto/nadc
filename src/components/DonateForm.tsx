"use client";

import { useState } from "react";

const MONTHLY_AMOUNTS = [10, 15, 25, 50];
const ONETIME_AMOUNTS = [25, 50, 100, 250];

export default function DonateForm() {
  const [recurring, setRecurring] = useState(true); // recurring-first by design
  const [amount, setAmount] = useState<number>(15);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const amounts = recurring ? MONTHLY_AMOUNTS : ONETIME_AMOUNTS;
  const effective = custom ? Math.round(parseFloat(custom) * 100) : amount * 100;

  async function checkout() {
    setError(null);
    if (!Number.isFinite(effective) || effective < 100) {
      setError("Please enter an amount of at least $1.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/donate/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents: effective, recurring }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed.");
      window.location.href = data.url; // Stripe-hosted checkout
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
      setBusy(false);
    }
  }

  return (
    <div className="card p-6">
      <div role="group" aria-label="Donation frequency" className="grid grid-cols-2 border border-[#CCCCCC] rounded-sm overflow-hidden mb-6">
        <button
          type="button"
          aria-pressed={recurring}
          onClick={() => { setRecurring(true); setAmount(15); setCustom(""); }}
          className={`px-4 py-3 font-body font-semibold text-sm ${recurring ? "bg-primary text-white" : "bg-white text-slate-600"}`}
        >
          Monthly — Neighbor
        </button>
        <button
          type="button"
          aria-pressed={!recurring}
          onClick={() => { setRecurring(false); setAmount(50); setCustom(""); }}
          className={`px-4 py-3 font-body font-semibold text-sm ${!recurring ? "bg-primary text-white" : "bg-white text-slate-600"}`}
        >
          One-time gift
        </button>
      </div>

      <div role="group" aria-label="Amount" className="grid grid-cols-4 gap-2 mb-4">
        {amounts.map((a) => (
          <button
            key={a}
            type="button"
            aria-pressed={!custom && amount === a}
            onClick={() => { setAmount(a); setCustom(""); }}
            className={`py-3 font-body font-semibold rounded-sm border ${
              !custom && amount === a ? "border-primary bg-primary/10 text-primary" : "border-[#CCCCCC] text-slate-600 hover:border-primary/40"
            }`}
          >
            ${a}
          </button>
        ))}
      </div>

      <label className="block mb-6">
        <span className="label">Custom amount (USD{recurring ? "/month" : ""})</span>
        <input
          type="number"
          min={1}
          step={1}
          className="input"
          placeholder="Other amount"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
        />
      </label>

      {error && (
        <p className="font-body text-sm text-accent-dark mb-4" role="alert">
          {error}
        </p>
      )}

      <button type="button" className="btn-accent w-full" onClick={checkout} disabled={busy}>
        {busy
          ? "Redirecting to secure checkout…"
          : recurring
            ? `Become a Neighbor — $${custom || amount}/month`
            : `Donate $${custom || amount}`}
      </button>
      <p className="font-body text-xs text-slate-400 mt-3">
        Payments are processed by Stripe on Stripe&apos;s servers — your card details never touch ours. Cancel a
        monthly membership anytime by replying to any receipt.
      </p>
    </div>
  );
}
