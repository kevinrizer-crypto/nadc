import Link from "next/link";
import type { Metadata } from "next";
import { getPillars, getImpacts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Learn: The Fact Base on Data Center Impacts",
  description:
    "Fact-checked, fully sourced research on how data centers affect electricity rates, water, property values, jobs, and local democracy — plus the playbook for fighting a proposal.",
  alternates: { canonical: "/learn" },
};

export default function LearnPage() {
  const pillars = getPillars();
  const impacts = getImpacts();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-2xl mb-14">
        <p className="section-label">The Fact Base</p>
        <h1 className="font-display text-4xl sm:text-5xl text-primary mb-4">Learn</h1>
        <p className="font-body text-base text-slate-500 leading-relaxed">
          Every claim is sourced and linked. We present the strongest version of industry&apos;s arguments before
          rebutting them — because a movement that engages all the evidence is one that gets taken seriously.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {pillars.map((p, i) => {
          const impact = impacts.find((c) => c.pillar === p.slug);
          return (
            <Link key={p.slug} href={`/learn/${p.slug}`} className="card p-7 hover:border-primary/40 transition-colors group block">
              <p className="font-mono text-2xs text-slate-400 uppercase tracking-[0.2em] mb-3">Pillar {i + 1}</p>
              <h2 className="font-display text-2xl text-primary mb-3 group-hover:underline underline-offset-4">
                {p.title}
              </h2>
              <p className="font-body text-sm text-slate-500 leading-relaxed mb-4">{p.metaDescription}</p>
              {impact && (
                <p className="font-mono text-2xs text-slate-400">
                  {impact.stat} <span className="text-slate-300">·</span> {impact.statLabel}
                </p>
              )}
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/learn/myth-vs-fact" className="card p-7 hover:border-primary/40 transition-colors block">
          <p className="section-label">Myth vs. Evidence</p>
          <h2 className="font-display text-2xl text-primary mb-2">Industry claims, fact-checked</h2>
          <p className="font-body text-sm text-slate-500">
            Jobs, tax revenue, &ldquo;green&rdquo; claims, and the &ldquo;it&apos;s just a warehouse&rdquo; framing —
            each met with the strongest version of the industry case, then the evidence.
          </p>
        </Link>
        <Link href="/learn/glossary" className="card p-7 hover:border-primary/40 transition-colors block">
          <p className="section-label">Glossary</p>
          <h2 className="font-display text-2xl text-primary mb-2">Key terms, decoded</h2>
          <p className="font-body text-sm text-slate-500">
            Megawatts, PILOT agreements, by-right zoning, evaporative cooling — the vocabulary you need to read a
            rezoning application like a professional.
          </p>
        </Link>
      </div>
    </div>
  );
}
