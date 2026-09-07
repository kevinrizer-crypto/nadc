"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { ClientProject } from "@/app/tracker/page";

// Status → marker color (brand palette).
const MARKER_COLORS: Record<string, string> = {
  proposed: "#00469C",
  contested: "#CC1332",
  approved: "#B45309",
  under_construction: "#B45309",
  delayed: "#64748B",
  operating: "#64748B",
  withdrawn: "#047857",
  blocked: "#047857",
  canceled: "#047857",
};

const TIER_NOTES: Record<string, string> = {
  verified: "✓ Verified by NADC",
  corroborated: "Reported — not independently verified by NADC",
  lead: "Lead — pending review",
};

const SOURCE = "projects";

/** Status → colour as a MapLibre expression, so the GPU does the work. */
const COLOR_EXPRESSION: maplibregl.ExpressionSpecification = [
  "match",
  ["get", "status"],
  ...Object.entries(MARKER_COLORS).flatMap(([k, v]) => [k, v]),
  "#64748B",
] as unknown as maplibregl.ExpressionSpecification;

/**
 * Interactive US map of tracked projects. Tiles come from OpenFreeMap
 * (https://openfreemap.org) — free, no API key, no usage cap; swap
 * NEXT_PUBLIC_MAP_STYLE_URL for MapTiler/Protomaps if preferred.
 *
 * Points are drawn as a clustered GeoJSON layer rather than one DOM marker per
 * project. At 78 projects individual markers were fine; at 600+ they were 70%
 * of the page's DOM nodes and piled into unreadable heaps over metro areas.
 * Circle layers render on the GPU and stay smooth into the thousands.
 *
 * Accessibility: the rendered map is canvas, so individual points are not
 * focusable. The table view is the accessible equivalent — it lists every
 * project as real links — and the map container points screen readers to it.
 */
export default function TrackerMap({
  projects,
  onRequestTable,
}: {
  projects: ClientProject[];
  onRequestTable?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);

  const toGeoJson = useCallback(
    (items: ClientProject[]) => ({
      type: "FeatureCollection" as const,
      features: items
        .filter((p) => p.latitude != null && p.longitude != null)
        .map((p) => ({
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: [p.longitude as number, p.latitude as number] },
          properties: {
            name: p.name,
            slug: p.slug,
            state: p.state,
            city: p.city ?? "",
            developer: p.developer ?? "",
            status: p.status,
            statusDetail: p.statusDetail ?? "",
            tier: p.verificationTier,
          },
        })),
    }),
    []
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // No `if (mapRef.current) return` guard: React can mount this component
    // twice (StrictMode in dev, and after a hydration mismatch in prod). That
    // guard let the second mount skip construction while the first map was
    // orphaned, leaving mapRef pointing at a map with no layers — which is why
    // setData later threw "There is no source with ID 'projects'". Each mount
    // now owns and disposes its own map.
    const map = new maplibregl.Map({
      container,
      style: process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://tiles.openfreemap.org/styles/positron",
      center: [-96, 38.5],
      zoom: 3.4,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.keyboard.enable();

    const setup = () => {
      try {
      if (map.getSource(SOURCE)) {
        setLoaded(true);
        return;
      }
      map.addSource(SOURCE, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        cluster: true,
        clusterRadius: 45,
        clusterMaxZoom: 11,
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: SOURCE,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#00469C",
          "circle-opacity": 0.85,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          // Grow with the number of projects, so density reads at a glance.
          "circle-radius": ["step", ["get", "point_count"], 14, 10, 19, 50, 25, 150, 32],
        },
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: SOURCE,
        filter: ["has", "point_count"],
        layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12 },
        paint: { "text-color": "#ffffff" },
      });

      map.addLayer({
        id: "points",
        type: "circle",
        source: SOURCE,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": COLOR_EXPRESSION,
          "circle-radius": 7,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Clicking a cluster drills into it.
      map.on("click", "clusters", (e) => {
        const feature = map.queryRenderedFeatures(e.point, { layers: ["clusters"] })[0];
        const clusterId = feature?.properties?.cluster_id;
        if (clusterId == null) return;
        const src = map.getSource(SOURCE) as maplibregl.GeoJSONSource;
        src.getClusterExpansionZoom(clusterId).then((zoom) => {
          map.easeTo({ center: (feature.geometry as GeoJSON.Point).coordinates as [number, number], zoom });
        });
      });

      map.on("click", "points", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties as Record<string, string>;
        const color = MARKER_COLORS[p.status] ?? "#64748B";
        new maplibregl.Popup({ offset: 12, maxWidth: "280px" })
          .setLngLat((f.geometry as GeoJSON.Point).coordinates as [number, number])
          .setHTML(
            `<div style="font-family:'DM Sans',sans-serif">
               <a href="/tracker/${p.state.toLowerCase()}/${p.slug}" style="font-weight:600;color:#00469C;text-decoration:underline">${escapeHtml(p.name)}</a>
               <div style="font-size:12px;color:#64748b;margin-top:2px">${escapeHtml([p.city, p.state].filter(Boolean).join(", "))}${
              p.developer ? " · " + escapeHtml(p.developer) : ""
            }</div>
               <div style="font-size:11px;text-transform:uppercase;letter-spacing:.1em;margin-top:6px;color:${color}">${escapeHtml(
              p.statusDetail || p.status
            )}</div>
               <div style="font-size:10px;color:#94a3b8;margin-top:3px">${escapeHtml(TIER_NOTES[p.tier] ?? "")}</div>
             </div>`
          )
          .addTo(map);
      });

      for (const layer of ["clusters", "points"]) {
        map.on("mouseenter", layer, () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = ""));
      }

      setLoaded(true);
      } catch {
        // Style not parsed yet — the next styledata event retries. Without the
        // catch, a throw here skips setLoaded() and the overlay never clears.
      }
    };

    // Deliberately NOT map.on("load"): that waits for the first rendered frame,
    // so a map mounted while offscreen — a background tab, or the table view
    // selected — never fires it and sits on "Loading map…" forever. `styledata`
    // fires as soon as the style is parsed, regardless of painting. setup() is
    // idempotent, so firing repeatedly is harmless.
    // Try on every style event and once immediately. setup() is idempotent and
    // swallows "style not ready yet", so the next styledata simply retries —
    // no gate on isStyleLoaded(), which stays false indefinitely for a map that
    // is never painted.
    map.on("styledata", setup);
    map.on("load", setup);
    setup();

    mapRef.current = map;
    return () => {
      map.remove();
      // Only clear the ref if it still points at *this* map, so a slower
      // teardown cannot wipe a newer instance.
      if (mapRef.current === map) mapRef.current = null;
    };
  }, []);

  // Filters change the data, never the map instance.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    // Source may be absent if the style is mid-reload; skip rather than throw.
    const src = map.getSource(SOURCE) as maplibregl.GeoJSONSource | undefined;
    if (!src) return;
    src.setData(toGeoJson(projects));
  }, [projects, loaded, toGeoJson]);

  const plotted = projects.filter((p) => p.latitude != null && p.longitude != null).length;

  return (
    <div>
      <div className="relative">
        {!loaded && (
          <div className="absolute inset-0 z-10 card flex items-center justify-center bg-paper" role="status">
            <p className="font-mono text-xs text-slate-400">Loading map…</p>
          </div>
        )}
        <div
          ref={containerRef}
          role="img"
          aria-label={`Map of ${plotted} tracked data center projects. Switch to the table view for a readable list.`}
          className="h-[420px] sm:h-[520px] card"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
        <ul className="flex flex-wrap gap-4" aria-label="Map legend">
          {[
            ["Proposed", "#00469C"],
            ["Contested", "#CC1332"],
            ["Approved / Building", "#B45309"],
            ["Withdrawn / Blocked", "#047857"],
            ["Operating / Other", "#64748B"],
          ].map(([label, color]) => (
            <li key={label} className="flex items-center gap-1.5 font-mono text-2xs text-slate-500">
              <span aria-hidden="true" className="inline-block w-3 h-3 rounded-full" style={{ background: color }} />
              {label}
            </li>
          ))}
        </ul>
        {onRequestTable && (
          <button type="button" onClick={onRequestTable} className="font-body text-xs text-primary underline">
            Prefer a list? Switch to the table →
          </button>
        )}
      </div>
      {projects.length > plotted && (
        <p className="font-mono text-2xs text-slate-400 mt-2">
          {projects.length - plotted} of these have no mapped coordinates yet and appear only in the table.
        </p>
      )}
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
