import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { donations } from "@/db/schema";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { clientIp, hashIp, rateLimit } from "@/lib/security";
import { SITE_URL } from "@/lib/site";

const donateSchema = z.object({
  amountCents: z.number().int().min(100).max(5_000_000),
  recurring: z.boolean().default(true),
  attribution: z
    .object({
      source: z.string().max(120).optional(),
      medium: z.string().max(120).optional(),
      campaign: z.string().max(120).optional(),
      content: z.string().max(120).optional(),
      term: z.string().max(120).optional(),
      landing: z.string().max(200).optional(),
      ts: z.string().max(40).optional(),
    })
    .nullable()
    .optional(),
});

/**
 * Creates a Stripe Checkout session for a donation. Card data never touches
 * this server — Checkout is Stripe-hosted (PCI SAQ-A). Recurring "Neighbor"
 * memberships use an inline monthly price; one-time gifts use payment mode.
 */
export async function POST(req: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json(
      { error: "Donations aren't live yet — payment processing is not configured." },
      { status: 503 }
    );
  }

  if (!(await rateLimit(`donate:${hashIp(clientIp(req))}`, 10, 600))) {
    return NextResponse.json({ error: "Too many attempts. Please try again shortly." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = donateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid donation amount." }, { status: 400 });
  const { amountCents, recurring, attribution } = parsed.data;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: recurring ? "subscription" : "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: recurring ? 'NADC "Neighbor" monthly membership' : "Donation to Neighbors Against Data Centers",
            description: recurring
              ? "Monthly support that keeps the research free for every community."
              : "One-time support for fact-checked research and organizing tools.",
          },
          ...(recurring ? { recurring: { interval: "month" as const } } : {}),
        },
      },
    ],
    success_url: `${SITE_URL}/donate/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/donate`,
    metadata: { kind: "donation", recurring: String(recurring) },
  });

  await db.insert(donations).values({
    stripeSessionId: session.id,
    amountCents,
    recurring,
    status: "pending",
    attribution: attribution ?? null,
  });

  return NextResponse.json({ url: session.url });
}
