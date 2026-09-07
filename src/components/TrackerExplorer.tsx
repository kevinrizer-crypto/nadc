"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import StatusBadge from "./StatusBadge";
import TierBadge from "./TierBadge";
import TrackerMap from "./TrackerMap";
import { STATUS_LABELS, TIER_LABELS, US_STATES } from "@/lib/site";
import { formatDateUTC } from "@/lib/dates";
import type { ClientProject } from "@/app/tracker/page";

/** Rows rendered per page. 600+ <tr> at once is a slow render and a huge DOM. */
const PAGE_SIZE = 50;

export default function TrackerExplorer({ projects }: { projects: ClientProject[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [q, setQ] = useState(params.get("q") ?? "");
  const [state, setState] = useState(params.get("state") ?? "");
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [tier, setTier] = useState(params.get("tier") ?? "");
  const [view, setView] = useState<"map" | "table">("map");
  const [shown, setShown] = useState(PAGE_SIZE);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilters = [state, status, tier].filter(Boolean).length;

  // Mirror filters into the URL so a filtered view can be linked or shared.
  // replace(), not push(), so filtering doesn't fill the back button.
  useEffect(() => {
    const next = new URLSearchParams();
    if (q.trim()) next.set("q", q.trim());
    if (state) next.set("state", state);
    if (status) next.set("status", status);
    if (tier) next.set("tier", tier);
    const qs = next.toString();
    const t = setTimeout(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }), 300);
    return () => clearTimeout(t);
  }, [q, state, status, tier, pathname, router]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return projects.filter((p) => {
      if (state && p.state !== state) return false;
      if (status && p.status !== status) return false;
      if (tier && p.verificationTier !== tier) return false;
      if (!needle) return true;
      return [p.name, p.developer, p.city, p.county, p.state, p.nearestZip, US_STATES[p.state]]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(needle));
    });
  }, [projects, q, state, status, tier]);

  // A new result set should start at the top, not deep in a previous page.
  useEffect(() => setShown(PAGE_SIZE), [q, state, status, tier, view]);

  const statesPresent = [...new Set(projects.map((p) => p.state))].sort();
  const visible = filtered.slice(0, shown);

  function clearAll() {
    setQ("");
    setState("");
    setStatus("");
    setTier("");
  }

  const selects = (
    <>
      <label className="block sm:inline-block">
        <span className="sr-only">Filter by state</span>
        <select className="input sm:w-40" value={state} onChange={(e) => setState(e.target.value)}>
          <option value="">All states</option>
          {statesPresent.map((s) => (
            <option key={s} value={s}>
              {US_STATES[s] ?? s}
            </option>
          ))}
        </select>
      </label>
      <label className="block sm:inline-block">
        <span className="sr-only">Filter by status</span>
        <select className="input sm:w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="block sm:inline-block">
        <span className="sr-only">Filter by confidence</span>
        <select className="input sm:w-40" value={tier} onChange={(e) => setTier(e.target.value)}>
          <option value="">All confidence</option>
          <option value="verified">{TIER_LABELS.verified} only</option>
          <option value="corroborated">{TIER_LABELS.corroborated} only</option>
        </select>
      </label>
    </>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <label className="flex-1">
          <span className="sr-only">Search projects</span>
          <input
            type="search"
            className="input"
            placeholder="Search by project, city, ZIP, or developer…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>

        {/* Three stacked selects pushed the map off a phone screen entirely.
            They stay inline from sm up and collapse behind a toggle below it. */}
        <div className="hidden sm:flex gap-3">{selects}</div>

        <div className="flex gap-2 sm:hidden">
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            aria-expanded={filtersOpen}
            className="btn-outline flex-1 !py-2 text-sm"
          >
            Filters{activeFilters > 0 ? ` (${activeFilters})` : ""}
          </button>
          <div role="group" aria-label="View" className="flex border border-[#CCCCCC] rounded-sm overflow-hidden">
            {(["map", "table"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`px-3 py-2 font-body text-sm font-medium capitalize ${
                  view === v ? "bg-primary text-white" : "bg-white text-slate-600"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div
          role="group"
          aria-label="View"
          className="hidden sm:flex border border-[#CCCCCC] rounded-sm overflow-hidden"
        >
          {(["map", "table"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`px-4 py-2 font-body text-sm font-medium capitalize ${
                view === v ? "bg-primary text-white" : "bg-white text-slate-600 hover:bg-primary/5"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {filtersOpen && <div className="sm:hidden space-y-2 mb-3">{selects}</div>}

      <p className="font-mono text-xs text-slate-400 mb-4" role="status">
        {filtered.length.toLocaleString()} of {projects.length.toLocaleString()} tracked projects
        {activeFilters + (q.trim() ? 1 : 0) > 0 && (
          <button type="button" onClick={clearAll} className="ml-3 text-primary underline">
            Clear filters
          </button>
        )}
      </p>

      {view === "map" ? (
        <TrackerMap projects={filtered} onRequestTable={() => setView("table")} />
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-body text-sm text-slate-500 mb-3">No tracked projects match your search.</p>
          <p className="font-body text-sm text-slate-500">
            Know of one we&apos;re missing?{" "}
            <Link href="/report" className="text-primary underline">
              Report it
            </Link>{" "}
            and our team will verify and add it.
          </p>
        </div>
      ) : (
        <>
          {/* Cards on phones, table from md up: a 7-column table on a 390px
              screen is a horizontal-scroll trap. */}
          <ul className="md:hidden space-y-3">
            {visible.map((p) => (
              <li key={p.id} className="card p-4">
                <Link
                  href={`/tracker/${p.state.toLowerCase()}/${p.slug}`}
                  className="font-body font-semibold text-sm text-primary hover:underline"
                >
                  {p.name}
                </Link>
                <p className="font-body text-sm text-slate-600 mt-0.5">
                  {[p.city, US_STATES[p.state] ?? p.state].filter(Boolean).join(", ")}
                  {p.developer ? ` · ${p.developer}` : ""}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <StatusBadge status={p.status} detail={p.statusDetail} />
                  <TierBadge tier={p.verificationTier} />
                  {p.capacity && <span className="font-mono text-2xs text-slate-500">{p.capacity}</span>}
                </div>
                {p.nextHearingDate && (
                  <p className="font-mono text-2xs text-accent-dark mt-2">
                    Next hearing {formatDateUTC(p.nextHearingDate, { dateStyle: "medium" })}
                  </p>
                )}
              </li>
            ))}
          </ul>

          <div className="hidden md:block card overflow-x-auto">
            <table className="w-full text-left">
              <caption className="sr-only">Tracked data center projects</caption>
              <thead>
                <tr className="border-b border-[#CCCCCC]">
                  {["Project", "Location", "Developer", "Status", "Confidence", "Capacity", "Next hearing"].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="font-mono text-2xs uppercase tracking-[0.15em] text-slate-400 px-4 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id} className="border-b border-[#EEEEEE] last:border-0 hover:bg-primary/5">
                    <td className="px-4 py-3">
                      <Link
                        href={`/tracker/${p.state.toLowerCase()}/${p.slug}`}
                        className="font-body font-semibold text-sm text-primary hover:underline"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-slate-600">
                      {[p.city, p.state].filter(Boolean).join(", ")}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-slate-600">{p.developer ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} detail={p.statusDetail} />
                    </td>
                    <td className="px-4 py-3">
                      <TierBadge tier={p.verificationTier} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.capacity ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {p.nextHearingDate ? formatDateUTC(p.nextHearingDate, { dateStyle: "medium" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {shown < filtered.length && (
            <div className="text-center mt-6">
              <button type="button" onClick={() => setShown((n) => n + PAGE_SIZE)} className="btn-outline">
                Show {Math.min(PAGE_SIZE, filtered.length - shown)} more
              </button>
              <p className="font-mono text-2xs text-slate-400 mt-2">
                Showing {visible.length.toLocaleString()} of {filtered.length.toLocaleString()}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
