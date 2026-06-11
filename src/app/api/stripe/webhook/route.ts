import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/db";
import { donations, orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { sendAdminNotification } from "@/lib/email";

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
        await db
          .update(donations)
          .set({
            status: session.mode === "subscription" ? "active" : "completed",
            email,
            stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
            stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : null,
            updatedAt: new Date(),
          })
          .where(eq(donations.stripeSessionId, session.id));
        await sendAdminNotification(
          "Donation received",
          `<p>${((session.amount_total ?? 0) / 100).toFixed(2)} USD ${session.mode === "subscription" ? "(monthly Neighbor)" : "(one-time)"}</p>`
        );
      } else if (session.metadata?.kind === "store") {
        await db
          .update(orders)
          .set({
            status: "paid",
            email,
            shippingAddress: session.collected_information?.shipping_details ?? null,
            updatedAt: new Date(),
          })
          .where(eq(orders.stripeSessionId, session.id));
        await sendAdminNotification(
          "Store order paid",
          `<p>Order for ${((session.amount_total ?? 0) / 100).toFixed(2)} USD. Fulfill via the admin panel${
            process.env.PRINTFUL_API_KEY ? " (Printful configured)" : " (set up Printful to automate fulfillment)"
          }.</p>`
        );
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
