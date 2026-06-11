"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart";

export default function CartPage() {
  const { items, remove, setQuantity, totalCents } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function checkout() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/store/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            variant: i.variant,
            customization: i.customization,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-4xl text-primary mb-8">Your cart</h1>

      {items.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-body text-sm text-slate-500 mb-4">Your cart is empty.</p>
          <Link href="/store" className="btn-primary">
            Browse the store
          </Link>
        </div>
      ) : (
        <>
          <ul className="card divide-y divide-[#EEEEEE] mb-6">
            {items.map((item, i) => (
              <li key={`${item.productId}-${item.variant}-${item.customization}`} className="p-5 flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-body font-semibold text-sm text-ink">{item.name}</p>
                  <p className="font-body text-xs text-slate-500">
                    {[item.variant, item.customization && `"${item.customization}"`].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <label className="flex items-center gap-2">
                  <span className="sr-only">Quantity for {item.name}</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    className="input !w-20 !py-2"
                    value={item.quantity}
                    onChange={(e) => setQuantity(i, parseInt(e.target.value || "1", 10))}
                  />
                </label>
                <span className="font-mono text-sm text-ink w-20 text-right">
                  ${((item.priceCents * item.quantity) / 100).toFixed(2)}
                </span>
                <button
                  type="button"
                  className="font-body text-xs text-accent underline"
                  onClick={() => remove(i)}
                  aria-label={`Remove ${item.name} from cart`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between mb-6">
            <span className="font-body font-semibold text-ink">Total</span>
            <span className="font-display text-2xl text-primary">${(totalCents / 100).toFixed(2)}</span>
          </div>

          {error && (
            <p className="font-body text-sm text-accent-dark mb-4" role="alert">
              {error}
            </p>
          )}

          <button type="button" className="btn-accent w-full" onClick={checkout} disabled={busy}>
            {busy ? "Redirecting to secure checkout…" : "Check out"}
          </button>
          <p className="font-body text-xs text-slate-400 mt-3">
            Checkout and shipping details are handled securely by Stripe. Store proceeds fund the research operation.
          </p>
        </>
      )}
    </div>
  );
}
