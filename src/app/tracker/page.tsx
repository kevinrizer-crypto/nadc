import type { Metadata } from "next";
import { Suspense } from "react";
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
        <p className="font-body text-base text-slate-500 leading-relaxed">
          Every entry is verified against public records and carries its sources. Maintained by NADC staff and grown by
          tips from neighbors — statuses change month to month, so check the &ldquo;last verified&rdquo; date before
          relying on an entry.
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
        // Suspense is required because TrackerExplorer reads URL search params
        // (?q=, ?state=) — without it, prerendering this page fails.
        <Suspense
          fallback={
            <div className="h-[420px] card flex items-center justify-center" role="status">
              <p className="font-mono text-xs text-slate-400">Loading tracker…</p>
            </div>
          }
        >
          <TrackerExplorer projects={projects.map(toClientProject)} />
        </Suspense>
      )}
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
  };
}

export type ClientProject = ReturnType<typeof toClientProject>;
