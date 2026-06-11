import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getPillar, getPillars, PILLAR_ORDER } from "@/lib/content";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export function generateStaticParams() {
  return PILLAR_ORDER.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const pillar = getPillar(slug);
  if (!pillar) return {};
  return {
    title: pillar.title,
    description: pillar.metaDescription,
    alternates: { canonical: `/learn/${slug}` },
    openGraph: { title: pillar.title, description: pillar.metaDescription },
  };
}

export default async function PillarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pillar = getPillar(slug);
  if (!pillar) notFound();

  const others = getPillars().filter((p) => p.slug !== slug);

  // Article + FAQPage structured data for search and AI citability.
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: pillar.title,
      description: pillar.metaDescription,
      url: `${SITE_URL}/learn/${slug}`,
      publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: pillar.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="font-mono text-2xs text-slate-400 uppercase tracking-[0.2em] mb-6">
        <Link href="/learn" className="hover:text-primary">
          Learn
        </Link>{" "}
        / Pillar
      </nav>

      <h1 className="font-display text-4xl sm:text-5xl text-primary leading-tight mb-6">{pillar.title}</h1>
      <p className="font-body text-lg text-slate-500 leading-relaxed mb-10">{pillar.metaDescription}</p>

      {/* Key takeaways box */}
      <aside aria-label="Key takeaways" className="card border-primary/30 bg-primary/5 p-6 mb-10">
        <h2 className="section-label !text-primary">Key takeaways</h2>
        <div className="prose-nadc [&_ul]:mb-0" dangerouslySetInnerHTML={{ __html: pillar.keyTakeawaysHtml }} />
      </aside>

      <div className="prose-nadc" dangerouslySetInnerHTML={{ __html: pillar.bodyHtml }} />

      {/* FAQ */}
      <section aria-labelledby="faq-heading" className="mt-14">
        <h2 id="faq-heading" className="font-display text-3xl text-primary mb-6">
          FAQ
        </h2>
        <div className="card divide-y divide-[#CCCCCC]">
          {pillar.faqs.map((f) => (
            <details key={f.q} className="group px-6 py-4">
              <summary className="font-body font-semibold text-sm text-ink cursor-pointer list-none flex justify-between items-start gap-3 hover:text-primary">
                {f.q}
                <span aria-hidden="true" className="text-slate-400 group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <p className="font-body text-sm text-slate-600 leading-relaxed mt-3">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Sources — preserved verbatim from the fact-checked source list */}
      <section aria-labelledby="sources-heading" className="mt-14">
        <h2 id="sources-heading" className="font-display text-3xl text-primary mb-4">
          Sources
        </h2>
        <div
          className="prose-nadc card p-6 [&_ul]:mb-0 [&_li]:text-sm [&_a]:font-mono [&_a]:text-xs"
          dangerouslySetInnerHTML={{ __html: pillar.sourcesHtml }}
        />
      </section>

      {/* Cluster cross-links */}
      <nav aria-label="Related research" className="mt-14 border-t border-[#CCCCCC] pt-8">
        <p className="section-label">Keep reading</p>
        <ul className="grid sm:grid-cols-2 gap-3">
          {others.map((p) => (
            <li key={p.slug}>
              <Link href={`/learn/${p.slug}`} className="font-body text-sm text-primary underline underline-offset-2">
                {p.title}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/tracker" className="font-body text-sm text-primary underline underline-offset-2">
              National Data Center Tracker — is a project proposed near you?
            </Link>
          </li>
        </ul>
      </nav>
    </article>
  );
}
