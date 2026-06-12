"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { ClientProject } from "@/app/tracker/page";

// Status → marker color (brand palette).
const MARKER_COLORS: Record<string, string> = {
  proposed: "#00469C",
  contested: "#CC1332",
  approved: "#B45309",
  delayed: "#64748B",
  operating: "#64748B",
  withdrawn: "#047857",
  blocked: "#047857",
  canceled: "#047857",
};

/**
 * Interactive US map of tracked projects. Tiles come from OpenFreeMap
 * (https://openfreemap.org) — free, no API key, no usage cap; swap
 * NEXT_PUBLIC_MAP_STYLE_URL for MapTiler/Protomaps if preferred.
 */
export default function TrackerMap({ projects }: { projects: ClientProject[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://tiles.openfreemap.org/styles/positron",
      center: [-96, 38.5],
      zoom: 3.4,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.keyboard.enable();
    map.on("load", () => setLoaded(true));
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    for (const p of projects) {
      if (p.latitude == null || p.longitude == null) continue;
      const el = document.createElement("div");
      el.style.cssText = `width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4);background:${
        MARKER_COLORS[p.status] ?? "#64748B"
      };cursor:pointer`;
      el.setAttribute("role", "button");
      el.setAttribute("aria-label", `${p.name}, ${p.city ?? ""} ${p.state}`);

      const popup = new maplibregl.Popup({ offset: 12, maxWidth: "280px" }).setHTML(
        `<div style="font-family:'DM Sans',sans-serif">
           <a href="/tracker/${p.state.toLowerCase()}/${p.slug}" style="font-weight:600;color:#00469C;text-decoration:underline">${escapeHtml(p.name)}</a>
           <div style="font-size:12px;color:#64748b;margin-top:2px">${escapeHtml([p.city, p.state].filter(Boolean).join(", "))}${
          p.developer ? " · " + escapeHtml(p.developer) : ""
        }</div>
           <div style="font-size:11px;text-transform:uppercase;letter-spacing:.1em;margin-top:6px;color:${MARKER_COLORS[p.status] ?? "#64748B"}">${escapeHtml(
          p.statusDetail ?? p.status
        )}</div>
         </div>`
      );

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([p.longitude, p.latitude])
        .setPopup(popup)
        .addTo(map);
      markersRef.current.push(marker);
    }
  }, [projects]);

  return (
    <div>
      <div className="relative">
        {!loaded && (
          <div className="absolute inset-0 z-10 card flex items-center justify-center bg-paper" role="status">
            <p className="font-mono text-xs text-slate-400">Loading map…</p>
          </div>
        )}
        <div ref={containerRef} className="h-[420px] sm:h-[520px] card" aria-label="Map of tracked data center projects" />
      </div>
      <ul className="flex flex-wrap gap-4 mt-3 mb-0" aria-label="Map legend">
        {[
          ["Proposed", "#00469C"],
          ["Contested", "#CC1332"],
          ["Approved", "#B45309"],
          ["Withdrawn / Blocked", "#047857"],
          ["Delayed / Other", "#64748B"],
        ].map(([label, color]) => (
          <li key={label} className="flex items-center gap-1.5 font-mono text-2xs text-slate-500">
            <span aria-hidden="true" className="inline-block w-3 h-3 rounded-full" style={{ background: color }} />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
