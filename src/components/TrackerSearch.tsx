"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Hero search: routes to the tracker with a query (city, state, ZIP, developer). */
export default function TrackerSearch() {
  const [q, setQ] = useState("");
  const router = useRouter();

  return (
    <form
      role="search"
      aria-label="Search the national data center tracker"
      className="flex gap-2 p-2"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/tracker?q=${encodeURIComponent(q)}`);
      }}
    >
      <label className="flex-1">
        <span className="sr-only">Search by city, state, ZIP, or developer</span>
        <input
          type="search"
          className="input"
          placeholder="Search by city, state, ZIP, or developer…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>
      {/* Deliberately btn-outline, not btn-accent: this control navigates away
          to /tracker. When it was solid red it was the loudest thing in the
          fold, outranking the subscribe button directly beneath it. */}
      <button type="submit" className="btn-outline whitespace-nowrap">
        Search
      </button>
    </form>
  );
}
