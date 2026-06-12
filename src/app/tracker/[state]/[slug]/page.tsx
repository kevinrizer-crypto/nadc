import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/db";
import { projectContacts, petitions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getProjectBySlug, getPublishedProjects } from "@/lib/queries";
import { PILLAR_ORDER } from "@/lib/content";
import { SITE_URL, SITE_NAME, US_STATES, STATUS_LABELS } from "@/lib/site";
import { formatDateUTC } from "@/lib/dates";
import StatusBadge from "@/components/StatusBadge";
import SubscribeForm from "@/components/SubscribeForm";

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const projects = await getPublishedProjects();
    return projects.map((p) => ({ state: p.state.toLowerCase(), slug: p.slug }));
  } catch {
    return []; // DB unavailable at build → render on demand
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; slug: string }>;
}): Promise<Metadata> {
  const { state, slug } = await params;
  const project = await getProjectBySlug(state, slug).catch(() => null);
  if (!project) return {};
  const place = [project.city, US_STATES[project.state] ?? project.state].filter(Boolean).join(", ");
  const title = `${project.name}, ${place}: status, impacts, hearings, how to get involved`;
  const description = `${project.name} (${project.statusDetail ?? STATUS_LABELS[project.status]}) — ${
    project.developer ? `developer: ${project.developer}. ` : ""
  }${project.capacity ? `Capacity: ${project.capacity}. ` : ""}Verified facts, sources, and how neighbors can act.`;
  return {
    title,
    description,
    alternates: { canonical: `/tracker/${state.toLowerCase()}/${slug}` },
    openGraph: { title, description },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ state: string; slug: string }> }) {
  const { state, slug } = await params;
  // DB errors intentionally throw (→ error boundary), so an outage renders a
  // retryable error page rather than a misleading 404.
  const project = await getProjectBySlug(state, slug);
  if (!project) notFound();

  const [contacts, relatedPetitions] = await Promise.all([
    db.select().from(projectContacts).where(eq(projectContacts.projectId, project.id)),
    db.select().from(petitions).where(eq(petitions.projectId, project.id)),
  ]);

  const place = [project.city, US_STATES[project.state] ?? project.state].filter(Boolean).join(", ");
  const sources = (project.sources ?? []) as { url: string; label?: string; accessedAt?: string }[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: `${project.name} (proposed data center)`,
    description: project.notes ?? undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: project.city ?? undefined,
      addressRegion: project.state,
      postalCode: project.nearestZip ?? undefined,
      addressCountry: "US",
    },
    geo:
      project.latitude != null
        ? { "@type": "GeoCoordinates", latitude: project.latitude, longitude: project.longitude }
        : undefined,
    url: `${SITE_URL}/tracker/${state.toLowerCase()}/${slug}`,
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="font-mono text-2xs text-slate-400 uppercase tracking-[0.2em] mb-6">
        <Link href="/tracker" className="hover:text-primary">
          Tracker
        </Link>{" "}
        / {US_STATES[project.state] ?? project.state}
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
        <h1 className="font-display text-4xl sm:text-5xl text-primary leading-tight">{project.name}</h1>
        <StatusBadge status={project.status} detail={project.statusDetail} />
      </div>
      <p className="font-body text-lg text-slate-500 mb-8">{place}</p>

      {/* Verification stamp — honesty about data freshness */}
      <p className="card border-amber-300 bg-amber-50 px-4 py-3 font-body text-xs text-amber-900 mb-10">
        {project.verifiedAt ? (
          <>
            Last verified against sources on{" "}
            <strong>{formatDateUTC(project.verifiedAt)}</strong>. Statuses
            change month to month — check the sources below before relying on this entry, and{" "}
            <Link href="/report" className="underline">
              tell us
            </Link>{" "}
            if something has changed.
          </>
        ) : (
          <>
            <strong>Unverified:</strong> this entry has not yet completed editorial verification. Treat details as
            preliminary.
          </>
        )}
      </p>

      {/* Fact table */}
      <div className="card divide-y divide-[#EEEEEE] mb-10">
        {(
          [
            ["Developer", project.developer],
            ["County", project.county ? `${project.county} County` : null],
            ["Nearest ZIP", project.nearestZip],
            ["Capacity", project.capacity],
            ["Reported investment", project.investment],
            [
              "Next public hearing",
              project.nextHearingDate
                ? formatDateUTC(project.nextHearingDate) +
                  (project.nextHearingDetails ? ` — ${project.nextHearingDetails}` : "")
                : null,
            ],
            ["Local opposition group", project.oppositionGroup],
          ] as [string, string | null][]
        ).map(([label, value]) => (
          <div key={label} className="grid grid-cols-1 sm:grid-cols-3 px-5 py-3 gap-1">
            <dt className="font-mono text-2xs uppercase tracking-[0.15em] text-slate-400 self-center">{label}</dt>
            <dd className="sm:col-span-2 font-body text-sm text-ink">
              {value ?? <span className="text-slate-400">Not yet confirmed</span>}
            </dd>
          </div>
        ))}
        {project.municipalityUrl && (
          <div className="grid grid-cols-1 sm:grid-cols-3 px-5 py-3 gap-1">
            <dt className="font-mono text-2xs uppercase tracking-[0.15em] text-slate-400 self-center">Municipality</dt>
            <dd className="sm:col-span-2">
              <a href={project.municipalityUrl} className="font-body text-sm text-primary underline" rel="noopener">
                Planning / zoning page ↗
              </a>
            </dd>
          </div>
        )}
      </div>

      {project.notes && (
        <section className="mb-10">
          <h2 className="font-display text-2xl text-primary mb-3">What we know</h2>
          <p className="font-body text-[0.97rem] text-slate-700 leading-relaxed">{project.notes}</p>
        </section>
      )}

      {/* Decision-makers */}
      <section className="mb-10">
        <h2 className="font-display text-2xl text-primary mb-3">Decision-makers</h2>
        {contacts.length === 0 ? (
          <p className="font-body text-sm text-slate-500">
            Decision-maker contacts for this project are still being researched.{" "}
            <Link href="/act/officials" className="text-primary underline">
              Look up your officials by address →
            </Link>
          </p>
        ) : (
          <ul className="card divide-y divide-[#EEEEEE]">
            {contacts.map((c) => (
              <li key={c.id} className="px-5 py-3">
                <p className="font-body font-semibold text-sm text-ink">{c.name}</p>
                {c.role && <p className="font-body text-xs text-slate-500">{c.role}</p>}
                <p className="font-mono text-xs text-slate-500 mt-1 space-x-3">
                  {c.officeEmail && <a className="text-primary underline" href={`mailto:${c.officeEmail}`}>{c.officeEmail}</a>}
                  {c.officePhone && <span>{c.officePhone}</span>}
                  {c.officeUrl && (
                    <a className="text-primary underline" href={c.officeUrl} rel="noopener">
                      office page ↗
                    </a>
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="font-mono text-2xs text-slate-400 mt-2">
          NADC publishes public-office contact channels only — never personal information.
        </p>
      </section>

      {/* How to get involved */}
      <section className="mb-10">
        <h2 className="font-display text-2xl text-primary mb-4">How to get involved</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {relatedPetitions.map((pet) => (
            <Link key={pet.id} href={`/act/petitions/${pet.slug}`} className="card p-5 hover:border-primary/40 block">
              <p className="section-label">Petition</p>
              <p className="font-body font-semibold text-sm text-ink">{pet.title}</p>
            </Link>
          ))}
          <Link href="/learn/how-to-fight-playbook" className="card p-5 hover:border-primary/40 block">
            <p className="section-label">Playbook</p>
            <p className="font-body font-semibold text-sm text-ink">How to fight a data center proposal, step by step</p>
          </Link>
          <Link href="/act/officials" className="card p-5 hover:border-primary/40 block">
            <p className="section-label">Write your officials</p>
            <p className="font-body font-semibold text-sm text-ink">Find your representatives and send a letter that counts</p>
          </Link>
          <Link href="/organize" className="card p-5 hover:border-primary/40 block">
            <p className="section-label">Organize</p>
            <p className="font-body font-semibold text-sm text-ink">
              {project.oppositionGroup ? `Connect with ${project.oppositionGroup}` : "Find or start a local group"}
            </p>
          </Link>
        </div>
      </section>

      {/* Alerts for this project */}
      <section className="card p-6 mb-10">
        <h2 className="font-body font-semibold text-ink mb-1">Get alerts about this project</h2>
        <p className="font-body text-sm text-slate-500 mb-4">
          Hearing dates, status changes, and filings{project.nearestZip ? ` near ${project.nearestZip}` : ""}.
        </p>
        <SubscribeForm compact defaultZip={project.nearestZip ?? ""} />
      </section>

      {/* Sources */}
      <section>
        <h2 className="font-display text-2xl text-primary mb-3">Sources</h2>
        {sources.length === 0 ? (
          <p className="font-body text-sm text-amber-900">
            No sources on file — this entry is pending editorial review and should not be cited.
          </p>
        ) : (
          <ul className="space-y-2">
            {sources.map((s) => (
              <li key={s.url} className="font-mono text-xs">
                <a href={s.url} className="text-primary underline break-all" rel="noopener">
                  {s.label ?? s.url}
                </a>
                {s.accessedAt && <span className="text-slate-400"> (accessed {s.accessedAt})</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Cluster links */}
      <nav aria-label="Related research" className="mt-12 border-t border-[#CCCCCC] pt-8">
        <p className="section-label">Understand the impacts</p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {PILLAR_ORDER.map((p) => (
            <li key={p.slug}>
              <Link href={`/learn/${p.slug}`} className="font-body text-sm text-primary underline underline-offset-2">
                {p.short}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </article>
  );
}
