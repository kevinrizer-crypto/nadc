import type { Metadata } from "next";
import Link from "next/link";
import { getGlossary } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Glossary of Key Terms",
  description:
    "Megawatts, PILOT agreements, by-right zoning, evaporative cooling, PUE — the data center vocabulary every neighbor needs to read a rezoning application.",
  alternates: { canonical: "/learn/glossary" },
};

export default function GlossaryPage() {
  const glossary = getGlossary();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: "NADC Glossary of Key Terms",
    url: `${SITE_URL}/learn/glossary`,
    hasDefinedTerm: glossary.map((g) => ({
      "@type": "DefinedTerm",
      name: g.term,
      description: g.def,
    })),
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="font-mono text-2xs text-slate-400 uppercase tracking-[0.2em] mb-6">
        <Link href="/learn" className="hover:text-primary">
          Learn
        </Link>{" "}
        / Glossary
      </nav>
      <h1 className="font-display text-4xl sm:text-5xl text-primary mb-4">Glossary of Key Terms</h1>
      <p className="font-body text-base text-slate-500 mb-10">
        The vocabulary you need to read a rezoning application, question a utility filing, and follow a hearing.
      </p>
      <dl className="space-y-6">
        {glossary.map((g) => (
          <div key={g.term} className="card p-6">
            <dt className="font-body font-semibold text-ink mb-2">{g.term}</dt>
            <dd className="font-body text-sm text-slate-600 leading-relaxed">{g.def}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
