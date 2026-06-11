"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart";

export default function StoreThanksPage() {
  const { clear } = useCart();
  useEffect(() => clear(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
      <h1 className="font-display text-4xl sm:text-5xl text-primary mb-4">Order received.</h1>
      <p className="font-body text-base text-slate-500 leading-relaxed mb-10">
        Stripe is sending your confirmation email now. Yard signs ship in 5–7 business days — plenty of time before the
        next hearing. Store proceeds fund the research operation.
      </p>
      <div className="flex justify-center gap-4">
        <Link href="/organize" className="btn-primary">
          Get the organizing toolkit
        </Link>
        <Link href="/store" className="btn-outline">
          Back to the store
        </Link>
      </div>
    </div>
  );
}
