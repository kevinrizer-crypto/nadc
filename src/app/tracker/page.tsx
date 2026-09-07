import type { Metadata } from "next";
import { getPublishedProjects } from "@/lib/queries";
import TrackerExplorer from "@/components/TrackerExplorer";

export const metadata: Metadata = {
  title: "National Data Center Tracker — Map & Database",
  description:
    "A filterable, verified map and database of proposed, contested, and resolved data center projects across the United States — with status, capacity, developer, hearings, and sources.",
  alternates: { canonical: "/tracker" },
};

export const revalidate = 300;

export default async function TrackerPage() {
  let projects: Awaited<ReturnType<typeof getPublishedProjects>> = [];
  let dbError = false;
  try {
    projects = await getPublishedProjects();
  } catch {
    dbError = true;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-2xl mb-10">
        <p className="section-label">Research</p>
        <h1 className="font-display text-4xl sm:text-5xl text-primary mb-4">Data Center Tracker</h1>
        {/* This used to say every entry was verified by NADC staff. That stopped
            being true once bulk datasets were imported, so it now describes the
            confidence labels instead of overclaiming. */}
        <p className="font-body text-base text-slate-500 leading-relaxed">
          Every entry cites its sources and carries a confidence label.{" "}
          <strong className="text-slate-600">Verified</strong> means we confirmed it against public records ourselves.{" "}
          <strong className="text-slate-600">Corroborated</strong> means two or more independent sources agree, but we
          have not re-checked it. Statuses change month to month — follow an entry&apos;s sources before relying on it,
          and{" "}
          <a href="/report" className="text-primary underline">
            tell us
          </a>{" "}
          if something is wrong.
        </p>
      </div>

      {dbError ? (
        <div className="card p-8 text-center" role="alert">
          <p className="font-body font-semibold text-ink mb-2">The tracker is temporarily unavailable.</p>
          <p className="font-body text-sm text-slate-500">
            We&apos;re working on it. In the meantime, you can still{" "}
            <a href="/report" className="text-primary underline">
              report a project
            </a>
            .
          </p>
        </div>
      ) : (
        // No Suspense boundary needed: TrackerExplorer reads the URL in an
        // effect rather than via useSearchParams, so nothing here bails out of
        // static rendering and the page hydrates the server HTML as-is.
        <TrackerExplorer projects={projects.map(toClientProject)} />
      )}

      {/* CC BY 4.0 requires attribution for both bulk datasets we import. Each
          entry also credits its source individually, but the licences are on
          the datasets as wholes, so they are named here too. */}
      <p className="font-body text-xs text-slate-400 mt-10 leading-relaxed">
        Tracker entries are compiled from public records and local reporting, and each listing cites its own sources.
        Bulk data is drawn in part from{" "}
        <a href="https://epoch.ai/data/data-centers" className="underline hover:text-primary" rel="noopener" target="_blank">
          Epoch AI, Frontier Data Centers
        </a>{" "}
        and{" "}
        <a href="https://www.compute-atlas.com/" className="underline hover:text-primary" rel="noopener" target="_blank">
          Compute Atlas
        </a>
        , both used under{" "}
        <a href="https://creativecommons.org/licenses/by/4.0/" className="underline hover:text-primary" rel="noopener" target="_blank">
          CC BY 4.0
        </a>
        . Imported entries are labelled &ldquo;corroborated&rdquo; and have not been independently re-verified by NADC.
      </p>
    </div>
  );
}

// Strip server-only fields; keep the payload lean for the client component.
function toClientProject(p: Awaited<ReturnType<typeof getPublishedProjects>>[number]) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    developer: p.developer,
    city: p.city,
    county: p.county,
    state: p.state,
    nearestZip: p.nearestZip,
    latitude: p.latitude,
    longitude: p.longitude,
    status: p.status,
    statusDetail: p.statusDetail,
    capacity: p.capacity,
    investment: p.investment,
    nextHearingDate: p.nextHearingDate,
    verificationTier: p.verificationTier,
  };
}

export type ClientProject = ReturnType<typeof toClientProject>;
