"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Customizable yard-sign generator. Renders the official NADC design as an
 * inline SVG with the visitor's town, sized 18"×24". "Print / Save as PDF"
 * uses the browser's print dialog with an @page size matching a real yard
 * sign, so any local sign shop, Staples, or FedEx Office can print it.
 * Zero fulfillment touch; better for organizers (faster, cheaper in bulk,
 * local).
 */
export default function YardSignMaker({ defaultTown = "" }: { defaultTown?: string }) {
  const [town, setTown] = useState(defaultTown);
  const headline = town.trim().toUpperCase();

  return (
    <div className="grid lg:grid-cols-[1fr_22rem] gap-10 items-start">
      {/* Preview */}
      <div>
        <div className="sign-print-area mx-auto" style={{ maxWidth: 420 }}>
          <svg viewBox="0 0 900 1200" className="sign-svg w-full h-auto border border-[#CCCCCC]" xmlns="http://www.w3.org/2000/svg">
            {/* Border treatment: blue / red / blue frame on white, matching the printed sign */}
            <rect x="0" y="0" width="900" height="1200" fill="#ffffff" />
            <rect x="24" y="24" width="852" height="1152" fill="none" stroke="#00469C" strokeWidth="20" />
            <rect x="54" y="54" width="792" height="1092" fill="none" stroke="#CC1332" strokeWidth="14" />
            <rect x="80" y="80" width="740" height="1040" fill="none" stroke="#00469C" strokeWidth="8" />

            {/* Shield + wordmark */}
            <image href="/brand/shield.png" x="350" y="150" width="200" height="200" preserveAspectRatio="xMidYMid meet" />
            <text x="450" y="430" textAnchor="middle" fontFamily="'DM Sans', Arial, sans-serif" fontWeight="700" fontSize="58" fill="#3F403A" letterSpacing="1">
              NEIGHBORS AGAINST
            </text>
            <text x="450" y="495" textAnchor="middle" fontFamily="'DM Sans', Arial, sans-serif" fontWeight="700" fontSize="58" fill="#3F403A" letterSpacing="1">
              DATA CENTERS
            </text>
            <line x1="180" y1="560" x2="720" y2="560" stroke="#CC1332" strokeWidth="6" />

            {/* Headline — custom town, or the default message */}
            {headline ? (
              <>
                <text x="450" y="720" textAnchor="middle" fontFamily="'DM Sans', Arial, sans-serif" fontWeight="700" fontSize={headline.length > 12 ? 78 : 104} fill="#00469C">
                  {headline}
                </text>
                <text x="450" y="830" textAnchor="middle" fontFamily="'DM Sans', Arial, sans-serif" fontWeight="700" fontSize="64" fill="#3F403A">
                  AGAINST THE
                </text>
                <text x="450" y="905" textAnchor="middle" fontFamily="'DM Sans', Arial, sans-serif" fontWeight="700" fontSize="64" fill="#3F403A">
                  DATA CENTER
                </text>
              </>
            ) : (
              <>
                <text x="450" y="760" textAnchor="middle" fontFamily="'DM Sans', Arial, sans-serif" fontWeight="700" fontSize="96" fill="#3F403A">
                  PROTECT OUR
                </text>
                <text x="450" y="865" textAnchor="middle" fontFamily="'DM Sans', Arial, sans-serif" fontWeight="700" fontSize="96" fill="#3F403A">
                  NEIGHBORHOOD
                </text>
              </>
            )}

            <text x="450" y="1080" textAnchor="middle" fontFamily="'DM Mono', monospace" fontSize="34" fill="#00469C" letterSpacing="2">
              nadc.info
            </text>
          </svg>
        </div>
      </div>

      {/* Controls */}
      <div className="lg:sticky lg:top-24">
        <label className="block mb-4">
          <span className="label">Your town or community</span>
          <input
            type="text"
            className="input text-lg"
            placeholder="e.g. Griffin"
            value={town}
            maxLength={20}
            onChange={(e) => setTown(e.target.value)}
            aria-describedby="town-help"
          />
          <span id="town-help" className="font-body text-xs text-slate-400 mt-1 block">
            Leave blank for the standard &ldquo;Protect Our Neighborhood&rdquo; sign.
          </span>
        </label>

        <button type="button" className="btn-accent w-full mb-3" onClick={() => window.print()}>
          Download / Print sign (18&Prime;×24&Prime;)
        </button>
        <p className="font-body text-xs text-slate-500 leading-relaxed mb-6">
          Opens your print dialog — choose <strong>Save as PDF</strong> to get a print-ready file, or print directly.
          Take it to any local sign shop, Staples, or FedEx Office. Printing locally is usually cheapest for bulk —
          ask for 18&Prime;×24&Prime; corrugated plastic (&ldquo;coroplast&rdquo;) with an H-stake.
        </p>

        <div className="card p-4 bg-paper">
          <p className="font-body text-sm text-ink font-semibold mb-1">Want them printed &amp; shipped instead?</p>
          <p className="font-body text-xs text-slate-500">
            For pre-printed signs and bulk Organizer Kits,{" "}
            <Link href="/store" className="text-primary underline">
              visit the store
            </Link>
            . Store proceeds fund the research operation.
          </p>
        </div>
      </div>
    </div>
  );
}
