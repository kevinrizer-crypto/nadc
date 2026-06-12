"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import StatusBadge from "./StatusBadge";
import TierBadge from "./TierBadge";
import TrackerMap from "./TrackerMap";
import { STATUS_LABELS, TIER_LABELS, US_STATES } from "@/lib/site";
import { formatDateUTC } from "@/lib/dates";
import type { ClientProject } from "@/app/tracker/page";

export default function TrackerExplorer({ projects }: { projects: ClientProject[] }) {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [state, setState] = useState(params.get("state") ?? "");
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [tier, setTier] = useState(params.get("tier") ?? "");
  const [view, setView] = useState<"map" | "table">("map");

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

  const statesPresent = [...new Set(projects.map((p) => p.state))].sort();

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
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
        <label>
          <span className="sr-only">Filter by state</span>
          <select className="input sm:w-44" value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">All states</option>
            {statesPresent.map((s) => (
              <option key={s} value={s}>
                {US_STATES[s] ?? s}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Filter by status</span>
          <select className="input sm:w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Filter by confidence</span>
          <select className="input sm:w-40" value={tier} onChange={(e) => setTier(e.target.value)}>
            <option value="">All confidence</option>
            <option value="verified">{TIER_LABELS.verified} only</option>
            <option value="corroborated">{TIER_LABELS.corroborated} only</option>
          </select>
        </label>
        <div role="group" aria-label="View" className="flex border border-[#CCCCCC] rounded-sm overflow-hidden">
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

      <p className="font-mono text-xs text-slate-400 mb-4" role="status">
        {filtered.length} of {projects.length} tracked projects
      </p>

      {view === "map" ? (
        <TrackerMap projects={filtered} />
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
        <div className="card overflow-x-auto">
          <table className="w-full text-left">
            <caption className="sr-only">Tracked data center projects</caption>
            <thead>
              <tr className="border-b border-[#CCCCCC]">
                {["Project", "Location", "Developer", "Status", "Confidence", "Capacity", "Next hearing"].map((h) => (
                  <th key={h} scope="col" className="font-mono text-2xs uppercase tracking-[0.15em] text-slate-400 px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
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
      )}
    </div>
  );
}
