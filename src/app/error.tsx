"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <p className="section-label">Something went wrong</p>
      <h1 className="font-display text-4xl text-primary mb-4">We hit a snag loading this page.</h1>
      <p className="font-body text-base text-slate-500 mb-8">
        It&apos;s us, not you — likely a temporary database hiccup. Nothing you submitted was lost.
      </p>
      <button type="button" onClick={reset} className="btn-primary">
        Try again
      </button>
    </div>
  );
}
