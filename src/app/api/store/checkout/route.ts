import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { products, orders, orderItems } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { clientIp, hashIp, rateLimit } from "@/lib/security";
import { SITE_URL } from "@/lib/site";

const cartSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int(),
        quantity: z.number().int().min(1).max(100),
        variant: z.string().max(100).optional(),
        customization: z.string().max(60).optional(), // e.g. "[TOWN]" text for yard signs
      })
    )
    .min(1)
    .max(20),
});

/**
 * Creates a Stripe Checkout session for the cart. Prices are always read
 * from the database — the client only sends product IDs and quantities, so
 * a tampered cart can't change what's charged.
 */
export async function POST(req: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json(
      { error: "The store isn't live yet — payment processing is not configured." },
      { status: 503 }
    );
  }
  if (!(await rateLimit(`store:${hashIp(clientIp(req))}`, 15, 600))) {
    return NextResponse.json({ error: "Too many attempts. Please try again shortly." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = cartSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid cart." }, { status: 400 });
  const { items } = parsed.data;

  const dbProducts = await db
    .select()
    .from(products)
    .where(inArray(products.id, items.map((i) => i.productId)));
  const byId = new Map(dbProducts.map((p) => [p.id, p]));
  for (const item of items) {
    if (!byId.get(item.productId)?.active) {
      return NextResponse.json({ error: "One of the items in your cart is no longer available." }, { status: 400 });
    }
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: items.map((item) => {
      const p = byId.get(item.productId)!;
      const nameParts = [p.name];
      if (item.variant) nameParts.push(`(${item.variant})`);
      if (item.customization) nameParts.push(`— "${item.customization}"`);
      return {
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          unit_amount: p.priceCents,
          product_data: { name: nameParts.join(" ").slice(0, 250) },
        },
      };
    }),
    shipping_address_collection: { allowed_countries: ["US"] },
    success_url: `${SITE_URL}/store/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/store/cart`,
    metadata: { kind: "store" },
  });

  const total = items.reduce((sum, i) => sum + byId.get(i.productId)!.priceCents * i.quantity, 0);
  const [order] = await db
    .insert(orders)
    .values({ stripeSessionId: session.id, amountCents: total, status: "pending" })
    .returning({ id: orders.id });
  await db.insert(orderItems).values(
    items.map((i) => ({
      orderId: order.id,
      productId: i.productId,
      productName: byId.get(i.productId)!.name,
      variant: i.variant ?? null,
      customization: i.customization ?? null,
      quantity: i.quantity,
      unitPriceCents: byId.get(i.productId)!.priceCents,
    }))
  );

  return NextResponse.json({ url: session.url });
}
