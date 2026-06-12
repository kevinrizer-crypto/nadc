import type { Metadata } from "next";
import Link from "next/link";
import { getMyths, PILLAR_ORDER } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Myth vs. Fact: Industry Claims, Fact-Checked",
  description:
    "Jobs claims, tax revenue claims, green claims, and the 'it's just a warehouse' framing — the industry's strongest arguments, examined against the evidence.",
  alternates: { canonical: "/learn/myth-vs-fact" },
};

export default function MythVsFactPage() {
  const myths = getMyths();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: myths.map((m) => ({
      "@type": "Question",
      name: m.q,
      acceptedAnswer: { "@type": "Answer", text: `${m.a} Source: ${m.source}` },
    })),
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="font-mono text-2xs text-slate-400 uppercase tracking-[0.2em] mb-6">
        <Link href="/learn" className="hover:text-primary">
          Learn
        </Link>{" "}
        / Myth vs. Evidence
      </nav>
      <h1 className="font-display text-4xl sm:text-5xl text-primary mb-4">Industry claims, fact-checked</h1>
      <p className="font-body text-base text-slate-500 mb-10">
        We present the industry&apos;s strongest arguments before examining what the evidence actually shows.
        Accountability requires engaging the best version of the opposing case.
      </p>

      <div className="space-y-6">
        {myths.map((m) => {
          const pillar = PILLAR_ORDER.find((p) => p.slug === m.pillar);
          return (
            <article key={m.q} className="card p-6">
              <h2 className="font-body font-semibold text-ink mb-3">
                <span className="font-mono text-2xs uppercase tracking-[0.2em] text-accent block mb-2">The claim</span>
                &ldquo;{m.q.replace(/\?$/, "")}&rdquo;
              </h2>
              <p className="font-mono text-2xs uppercase tracking-[0.2em] text-primary mb-2">What the evidence shows</p>
              <p className="font-body text-sm text-slate-600 leading-relaxed mb-3">{m.a}</p>
              <p className="font-mono text-2xs text-slate-400">Source: {m.source}</p>
              {pillar && (
                <p className="mt-3">
                  <Link href={`/learn/${pillar.slug}`} className="font-body text-sm text-primary underline underline-offset-2">
                    Full analysis: {pillar.short} →
                  </Link>
                </p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
