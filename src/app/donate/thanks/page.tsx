import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/db";
import { donations } from "@/db/schema";
import { eq } from "drizzle-orm";
import RedditConversion from "@/components/RedditConversion";

export const metadata: Metadata = {
  title: "Thank You",
  robots: { index: false },
};

export default async function DonateThanksPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  // Look up the amount for an accurate Reddit Purchase value (best-effort).
  let value: number | undefined;
  if (session_id) {
    try {
      const row = (await db.select({ amountCents: donations.amountCents }).from(donations).where(eq(donations.stripeSessionId, session_id)).limit(1))[0];
      if (row) value = row.amountCents / 100;
    } catch {
      /* value is optional */
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
      <RedditConversion event="Purchase" value={value} />
      <h1 className="font-display text-4xl sm:text-5xl text-primary mb-4">Thank you, Neighbor.</h1>
      <p className="font-body text-base text-slate-500 leading-relaxed mb-3">
        Your support keeps the research free for every community that needs it. A receipt from Stripe is on its way to
        your inbox.
      </p>
      <p className="font-body text-sm text-slate-500 mb-10">
        Monthly memberships can be canceled anytime — just reply to any receipt and we&apos;ll take care of it.
      </p>
      <div className="flex justify-center gap-4">
        <Link href="/tracker" className="btn-primary">
          Explore the tracker
        </Link>
        <Link href="/subscribe" className="btn-outline">
          Get The Grid weekly
        </Link>
      </div>
    </div>
  );
}
