import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "About — Mission, Principles, Transparency",
  description:
    "NADC's mission, editorial principles, funding transparency, press kit, and contact. Fact-based, non-partisan, pro-transparency — not anti-technology.",
  alternates: { canonical: "/about" },
};

const PRINCIPLES = [
  "Every factual claim is sourced and linked.",
  "We present the strongest version of industry's arguments before rebutting them.",
  "We correct our own errors prominently.",
  'We distinguish between "data centers are bad everywhere" (not our position) and "communities deserve transparency, real cost-benefit analysis, and a vote" (our position).',
  "We never publish personal information about officials beyond public office contact channels.",
];

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/brand/logo-vertical.png`,
    description:
      "Nationwide, fact-checked hub turning alarmed neighbors into organized opposition to harmful data centers.",
    sameAs: [],
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <p className="section-label">About</p>
      <h1 className="font-display text-4xl sm:text-5xl text-primary mb-6">
        Where industry has lobbyists, neighbors have NADC.
      </h1>
      <p className="font-body text-base text-slate-600 leading-relaxed mb-4">
        Neighbors Against Data Centers equips residents, neighborhood groups, and local officials with credible
        information and practical tools to evaluate, question, and — where warranted — oppose data center construction
        in their communities.
      </p>
      <p className="font-body text-base text-slate-600 leading-relaxed mb-12">
        We are fact-based, not hysterical. We don&apos;t oppose technology — we oppose communities being left out of
        decisions about water, power, noise, land, and tax dollars that will affect them for decades. The AI buildout
        has triggered the largest wave of data center construction in history, much of it approved through NDAs,
        fast-tracked rezonings, and closed-door incentive deals. Opposition is everywhere but fragmented: every town
        fights alone, relearning the same lessons. NADC consolidates that knowledge into one national resource.
      </p>

      <section id="principles" className="mb-12 scroll-mt-24">
        <h2 className="font-display text-3xl text-primary mb-5">Editorial principles</h2>
        <ol className="card divide-y divide-[#EEEEEE]">
          {PRINCIPLES.map((p, i) => (
            <li key={i} className="px-6 py-4 flex gap-4">
              <span className="font-display text-2xl text-accent" aria-hidden="true">
                {i + 1}
              </span>
              <p className="font-body text-sm text-slate-700 leading-relaxed self-center">{p}</p>
            </li>
          ))}
        </ol>
        <p className="font-body text-sm text-slate-500 mt-3">
          Found an error? Email us — corrections are published prominently, not buried.
        </p>
      </section>

      <section id="funding" className="mb-12 scroll-mt-24">
        <h2 className="font-display text-3xl text-primary mb-5">Funding transparency</h2>
        <p className="font-body text-sm text-slate-700 leading-relaxed mb-3">
          NADC is funded by individual donations (one-time gifts and monthly &ldquo;Neighbor&rdquo; memberships) and
          store sales. We accept no funding from data center developers, utilities, or their trade associations — and
          none from their commercial competitors either. A watchdog astroturfed from any direction is worthless.
        </p>
        <p className="font-body text-sm text-slate-700 leading-relaxed mb-3">
          Our commitment: at least <strong>65 cents of every dollar</strong> goes directly to mission — research, the
          tracker, and free organizing tools — with that share rising toward 80–85% as the organization matures. We
          publish a breakdown of funding sources and spending on this page as the books grow.
        </p>
        <Link href="/donate" className="font-body text-sm text-primary underline">
          Support the work →
        </Link>
      </section>

      <section id="press" className="mb-12 scroll-mt-24">
        <h2 className="font-display text-3xl text-primary mb-5">Press kit</h2>
        <p className="font-body text-sm text-slate-700 leading-relaxed mb-4">
          Journalists: our tracker data, with sources, is available for reporting with attribution to
          &ldquo;Neighbors Against Data Centers (nadc.info)&rdquo;. Logos below; for interviews and data questions,
          use the contact address.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            ["logo-horizontal.png", "Horizontal lockup"],
            ["logo-vertical.png", "Vertical stacked"],
            ["shield.png", "Icon badge"],
            ["design-elements.png", "Design elements"],
          ].map(([file, label]) => (
            <a key={file} href={`/brand/${file}`} download className="card p-3 text-center hover:border-primary/40">
              <Image src={`/brand/${file}`} alt={`${label} — download`} width={160} height={120} className="mx-auto object-contain h-20 w-auto" />
              <span className="font-mono text-2xs text-slate-500 block mt-2">{label}</span>
            </a>
          ))}
        </div>
      </section>

      <section id="contact" className="scroll-mt-24">
        <h2 className="font-display text-3xl text-primary mb-5">Contact</h2>
        <ul className="font-body text-sm text-slate-700 space-y-2">
          <li>
            <strong>Tips:</strong>{" "}
            <Link href="/report" className="text-primary underline">
              use the tip line
            </Link>{" "}
            — it routes directly to our verification queue.
          </li>
          <li>
            <strong>Press &amp; general:</strong> <a href="mailto:hello@nadc.info" className="text-primary underline">hello@nadc.info</a>
          </li>
          <li>
            <strong>Corrections:</strong> <a href="mailto:corrections@nadc.info" className="text-primary underline">corrections@nadc.info</a>
          </li>
          <li>
            <strong>Volunteer:</strong> researchers, designers, organizers, and attorneys —{" "}
            <a href="mailto:volunteer@nadc.info" className="text-primary underline">volunteer@nadc.info</a>
          </li>
        </ul>
      </section>
    </div>
  );
}
