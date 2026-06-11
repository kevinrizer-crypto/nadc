import Stripe from "stripe";

/**
 * Stripe is the payment processor for donations and the store. Card data
 * never touches our servers — all flows use Stripe Checkout (hosted),
 * keeping PCI scope at SAQ-A.
 *
 * Honesty contract: without STRIPE_SECRET_KEY, checkout endpoints return
 * 503 with a clear message. No simulated payments, ever.
 */
export class StripeNotConfiguredError extends Error {
  constructor() {
    super("Stripe not configured (STRIPE_SECRET_KEY missing)");
  }
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new StripeNotConfiguredError();
  if (!_stripe) _stripe = new Stripe(key);
  return _stripe;
}
