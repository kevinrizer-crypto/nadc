import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/db";
import { donations, orders, orderItems, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { sendAdminNotification } from "@/lib/email";
import { createPrintfulOrder, printfulConfigured, type FulfillItem } from "@/lib/printful";
import { sendRedditConversion } from "@/lib/reddit-capi";

/** Forwards a paid order to Printful if every item maps to a sync variant. */
async function fulfillViaPrintful(orderId: number, email: string | null, shipping: unknown) {
  if (!printfulConfigured()) return;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  const productRows = await db.select().from(products);
  const byId = new Map(productRows.map((p) => [p.id, p]));

  const fulfill: FulfillItem[] = [];
  for (const item of items) {
    const product = item.productId ? byId.get(item.productId) : undefined;
    // Look up the Printful sync variant: by chosen variant label, else "" (single-variant), else legacy id.
    const map = product?.podVariantMap ?? {};
    const syncVariantId = (item.variant && map[item.variant]) || map[""] || product?.podProductId;
    if (syncVariantId) fulfill.push({ syncVariantId, quantity: item.quantity });
  }

  // Only auto-submit when EVERY line maps to Printful — partial orders (e.g. a
  // bulk yard sign mixed in) go to manual fulfillment to avoid shipping half.
  if (fulfill.length === 0 || fulfill.length !== items.length) return;

  try {
    const podOrderId = await createPrintfulOrder({
      externalId: String(orderId),
      shipping: shipping as never,
      email,
      items: fulfill,
    });
    if (podOrderId) {
      await db
        .update(orders)
        .set({ podOrderId, status: process.env.PRINTFUL_AUTO_CONFIRM === "true" ? "fulfilled" : "paid", updatedAt: new Date() })
        .where(eq(orders.id, orderId));
    }
  } catch (err) {
    console.error(`Printful fulfillment failed for order ${orderId}:`, err);
    await sendAdminNotification(
      "Printful fulfillment failed",
      `<p>Order #${orderId} is paid but could not be auto-submitted to Printful: ${(err as Error).message}. Fulfill it manually in the Printful dashboard.</p>`
    );
  }
}

/**
 * Stripe webhook: marks donations/orders paid, records subscription
 * lifecycle for recurring "Neighbor" memberships. Signature-verified with
 * STRIPE_WEBHOOK_SECRET; events we don't care about are acknowledged 200.
 *
 * Configure in Stripe Dashboard → Webhooks → https://nadc.info/api/stripe/webhook
 * Events: checkout.session.completed, customer.subscription.updated,
 *         customer.subscription.deleted
 */
export async function POST(req: Request) {
  if (!stripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse("not configured", { status: 503 });
  }
  const stripe = getStripe();
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new NextResponse("missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return new NextResponse("invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const email = session.customer_details?.email ?? null;

      if (session.metadata?.kind === "donation") {
        const [donation] = await db
          .update(donations)
          .set({
            status: session.mode === "subscription" ? "active" : "completed",
            email,
            stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
            stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : null,
            updatedAt: new Date(),
          })
          .where(eq(donations.stripeSessionId, session.id))
          .returning({ attribution: donations.attribution });
        await sendAdminNotification(
          "Donation received",
          `<p>${((session.amount_total ?? 0) / 100).toFixed(2)} USD ${session.mode === "subscription" ? "(monthly Neighbor)" : "(one-time)"}</p>`
        );
        // Reddit Conversions API (server-side Purchase). conversion_id = the
        // Stripe session id, which the thank-you page pixel also uses → dedup.
        // Match keys come from attribution captured at checkout (NOT the
        // webhook request, whose IP/UA belong to Stripe, not the donor).
        await sendRedditConversion({
          trackingType: "Purchase",
          conversionId: session.id,
          clickId: donation?.attribution?.rdtCid,
          uuid: donation?.attribution?.rdtUuid,
          email,
          valueDecimal: (session.amount_total ?? 0) / 100,
          currency: (session.currency ?? "usd").toUpperCase(),
        });
      } else if (session.metadata?.kind === "store") {
        const shipping = session.collected_information?.shipping_details ?? null;
        const [order] = await db
          .update(orders)
          .set({ status: "paid", email, shippingAddress: shipping, updatedAt: new Date() })
          .where(eq(orders.stripeSessionId, session.id))
          .returning({ id: orders.id });
        await sendAdminNotification(
          "Store order paid",
          `<p>Order for ${((session.amount_total ?? 0) / 100).toFixed(2)} USD. ${
            printfulConfigured() ? "Auto-forwarding to Printful…" : "Set up Printful to automate fulfillment, or fulfill via the admin panel."
          }</p>`
        );
        if (order) await fulfillViaPrintful(order.id, email, shipping);
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      await db
        .update(donations)
        .set({ status: "canceled", updatedAt: new Date() })
        .where(eq(donations.stripeSubscriptionId, sub.id));
      break;
    }
  }

  return NextResponse.json({ received: true });
}
