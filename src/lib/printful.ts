/**
 * Printful print-on-demand fulfillment. When a store order is paid (Stripe
 * webhook), we forward it to Printful, which prints each item and ships it
 * directly to the buyer — no inventory, no packing.
 *
 * Honesty contract: if PRINTFUL_API_KEY is missing, auto-fulfillment is
 * skipped and the order simply waits in /admin/orders for manual handling.
 * Nothing is faked.
 *
 * Order confirmation:
 *   PRINTFUL_AUTO_CONFIRM=true  → order is submitted for fulfillment
 *                                 immediately (true zero-touch; charges your
 *                                 Printful balance/card on each order).
 *   unset/false                 → order is created as a DRAFT in Printful for
 *                                 you to review and confirm in their dashboard
 *                                 (recommended for the first orders).
 */
export function printfulConfigured(): boolean {
  return Boolean(process.env.PRINTFUL_API_KEY);
}

type ShippingDetails = {
  name?: string | null;
  address?: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
  } | null;
};

export type FulfillItem = { syncVariantId: string; quantity: number };

/**
 * Creates a Printful order. Returns the Printful order id, or null if not
 * configured / no fulfillable items. Throws only on an unexpected API error
 * (caller logs and leaves the order for manual fulfillment).
 */
export async function createPrintfulOrder(opts: {
  externalId: string; // our order id, for idempotency on Printful's side
  shipping: ShippingDetails | null;
  email: string | null;
  items: FulfillItem[];
}): Promise<string | null> {
  const key = process.env.PRINTFUL_API_KEY;
  if (!key) return null;
  if (opts.items.length === 0) return null;

  const addr = opts.shipping?.address;
  if (!addr?.line1 || !addr.city || !addr.state || !addr.postal_code) {
    throw new Error("missing shipping address fields for Printful order");
  }

  const body = {
    external_id: opts.externalId,
    confirm: process.env.PRINTFUL_AUTO_CONFIRM === "true",
    recipient: {
      name: opts.shipping?.name ?? undefined,
      email: opts.email ?? undefined,
      address1: addr.line1,
      address2: addr.line2 ?? undefined,
      city: addr.city,
      state_code: addr.state,
      zip: addr.postal_code,
      country_code: addr.country ?? "US",
    },
    items: opts.items.map((i) => ({ sync_variant_id: Number(i.syncVariantId), quantity: i.quantity })),
  };

  const res = await fetch("https://api.printful.com/orders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(process.env.PRINTFUL_STORE_ID ? { "X-PF-Store-Id": process.env.PRINTFUL_STORE_ID } : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`Printful order failed ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { result?: { id?: number } };
  return data.result?.id ? String(data.result.id) : null;
}
