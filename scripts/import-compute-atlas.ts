/**
 * Imports the Compute Atlas dataset (CC BY 4.0) into the tracker.
 *
 *   npx tsx scripts/import-compute-atlas.ts            # dry run
 *   npx tsx scripts/import-compute-atlas.ts --apply    # writes
 *   npx tsx scripts/import-compute-atlas.ts --include-cancelled
 *   npx tsx scripts/import-compute-atlas.ts --include-operational
 *
 * Why this source: 1,300+ US facilities, every record carrying its own public
 * sources (permits, subsidy filings, rate cases, local press), released under
 * CC BY 4.0 — explicitly free for commercial reuse with attribution, the same
 * licence as the Epoch AI import. Attribution is required and is written onto
 * every row's sources array as well as the verification note.
 *
 *   Kubiak, E. Compute Atlas [Data set]. https://doi.org/10.5281/zenodo.22284476
 *
 * TIERING — deliberately conservative. Compute Atlas is itself a secondary
 * aggregator, so nothing imported here is ever marked `verified`; that tier is
 * reserved for entries confirmed by hand against a primary record.
 *
 *   >= 2 independent source domains  -> corroborated, PUBLISHED
 *   exactly 1 source domain          -> lead, held UNPUBLISHED
 *   confidence "rumored"             -> skipped entirely
 *
 * That mirrors the rule verify-leads already applies, so the tier means the
 * same thing to a reader regardless of which pipeline produced the row.
 *
 * DEDUPLICATION — we do not merge. A match against an existing project causes
 * the incoming row to be SKIPPED and logged, never merged into the existing
 * one. Silently merging two distinct campuses corrupts the sources of both
 * (the "Stargate" incident); leaving a possible duplicate visible is a smaller,
 * fixable error. Matching needs same state + close coordinates + a shared
 * significant word, so it stays tight.
 */
import "./load-env";
import { Pool } from "pg";

const DATASET_URL =
  process.env.COMPUTE_ATLAS_URL ??
  "https://raw.githubusercontent.com/ek33450505/compute-atlas/v1.31.0/data/facilities.json";
const ATTRIBUTION = "Compute Atlas (CC BY 4.0)";
const ATTRIBUTION_URL = "https://www.compute-atlas.com/";

type Source = { url?: string; label?: string; publisher?: string; retrievedAt?: string; kind?: string };
type Facility = {
  id?: string;
  name?: string;
  operator?: string;
  status?: string;
  confidence?: string;
  capacityMw?: { planned?: number; operational?: number } | null;
  investmentUsd?: number | null;
  notes?: string | null;
  sources?: Source[];
  location?: {
    lat?: number;
    lon?: number;
    city?: string;
    county?: string;
    state?: string;
    street?: string;
    precision?: string;
  } | null;
};

/** Compute Atlas status -> our project_status enum. */
const STATUS_MAP: Record<string, string> = {
  proposed: "proposed",
  permitted: "approved",
  under_construction: "under_construction",
  cancelled: "canceled",
  canceled: "canceled",
  operational: "operating",
};

const STOPWORDS = new Set([
  "data", "center", "centre", "centers", "campus", "project", "site", "facility", "the", "and", "llc",
  "inc", "corp", "group", "holdings", "phase", "expansion", "north", "south", "east", "west", "new",
]);

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 150);
}

/**
 * `extra` drops place words. Project names very often contain their own city
 * ("STACK Hillsboro Campus"), so without this every pair of projects in one
 * town shares a token and looks like the same site.
 */
function significantTokens(s: string, extra: (string | null | undefined)[] = []): Set<string> {
  const banned = new Set(STOPWORDS);
  for (const e of extra) {
    if (!e) continue;
    for (const w of e.toLowerCase().split(/[^a-z0-9]+/)) if (w.length > 2) banned.add(w);
  }
  return new Set(s.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 3 && !banned.has(t)));
}

function domainsOf(sources: Source[]): Set<string> {
  const out = new Set<string>();
  for (const s of sources) {
    if (!s.url) continue;
    try {
      out.add(new URL(s.url).hostname.replace(/^www\./, "").toLowerCase());
    } catch {
      /* unparseable URL contributes no domain */
    }
  }
  return out;
}

/** Great-circle distance in km. */
function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

type Existing = {
  id: number;
  name: string;
  state: string;
  city: string | null;
  developer: string | null;
  latitude: number | null;
  longitude: number | null;
};

/**
 * Returns the existing project this facility appears to duplicate, or null.
 * Requires same state AND (close coordinates OR same city) AND a shared
 * significant word in the name or operator — all three, so distinct campuses in
 * one county do not collapse into each other.
 */
function findExisting(f: Facility, existing: Existing[]): Existing | null {
  const state = f.location?.state?.toUpperCase();
  if (!state) return null;
  const place = [f.location?.city, f.location?.county, state];
  const tokens = new Set([
    ...significantTokens(f.name ?? "", place),
    ...significantTokens(f.operator ?? "", place),
  ]);
  if (tokens.size === 0) return null;

  for (const e of existing) {
    if (e.state.toUpperCase() !== state) continue;

    const eTokens = new Set([
      ...significantTokens(e.name, [...place, e.city]),
      ...significantTokens(e.developer ?? "", [...place, e.city]),
    ]);
    if (![...tokens].some((t) => eTokens.has(t))) continue;

    const bothHaveCoords =
      f.location?.lat != null && f.location?.lon != null && e.latitude != null && e.longitude != null;

    // With coordinates on both sides, proximity decides — two campuses in one
    // town are distinct sites and must not collapse. Same-city is only a
    // fallback for rows that have no coordinates to compare.
    if (bothHaveCoords) {
      if (haversineKm(f.location!.lat!, f.location!.lon!, e.latitude!, e.longitude!) < 2) return e;
      continue;
    }
    if (!!f.location?.city && !!e.city && f.location.city.toLowerCase() === e.city.toLowerCase()) return e;
  }
  return null;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const includeCancelled = process.argv.includes("--include-cancelled");
  const includeOperational = process.argv.includes("--include-operational");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set (see scripts/load-env.ts)");

  const wanted = new Set(["proposed", "permitted", "under_construction"]);
  if (includeCancelled) wanted.add("cancelled").add("canceled");
  if (includeOperational) wanted.add("operational");

  console.log(`Fetching ${DATASET_URL}`);
  const res = await fetch(DATASET_URL);
  if (!res.ok) throw new Error(`dataset fetch failed: HTTP ${res.status}`);
  const raw = (await res.json()) as unknown;
  const all: Facility[] = Array.isArray(raw) ? raw : ((raw as { facilities?: Facility[] }).facilities ?? []);
  console.log(`${all.length} records in dataset.\n`);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const existing: Existing[] = (
    await pool.query(`SELECT id, name, state, city, developer, latitude, longitude FROM projects`)
  ).rows;

  const counts = { corroborated: 0, lead: 0, rumored: 0, dupe: 0, noState: 0, outOfScope: 0 };
  const today = new Date().toISOString().slice(0, 10);
  let inserted = 0;

  for (const f of all) {
    if (!f.status || !wanted.has(f.status)) {
      counts.outOfScope++;
      continue;
    }
    if (f.confidence === "rumored") {
      counts.rumored++;
      continue;
    }
    const state = f.location?.state?.toUpperCase();
    if (!state || state.length !== 2 || !f.name) {
      counts.noState++;
      continue;
    }

    const dupe = findExisting(f, existing);
    if (dupe) {
      counts.dupe++;
      console.log(`[SKIP-DUPE] ${f.name} ≈ existing #${dupe.id} "${dupe.name}"`);
      continue;
    }

    const srcs = f.sources ?? [];
    const domainCount = domainsOf(srcs).size;
    if (domainCount === 0) {
      counts.noState++;
      continue;
    }
    const tier = domainCount >= 2 ? "corroborated" : "lead";
    const published = tier === "corroborated";
    counts[tier]++;

    const sources = [
      { url: ATTRIBUTION_URL, label: ATTRIBUTION, accessedAt: today },
      ...srcs
        .filter((s) => s.url)
        .map((s) => ({
          url: s.url as string,
          label: s.label ?? s.publisher ?? undefined,
          accessedAt: s.retrievedAt ?? today,
        })),
    ];

    const capMw = f.capacityMw?.planned ?? f.capacityMw?.operational ?? null;
    const capacity = capMw ? `${Math.round(capMw)} MW (planned, per Compute Atlas)` : null;
    const investment =
      typeof f.investmentUsd === "number" && f.investmentUsd > 0
        ? `~$${(f.investmentUsd / 1e9).toFixed(1)}B (announced, per Compute Atlas)`
        : null;

    const note =
      `Imported from Compute Atlas (CC BY 4.0) on ${today}. ` +
      `${domainCount} independent source domain${domainCount === 1 ? "" : "s"}; ` +
      `dataset confidence "${f.confidence ?? "unspecified"}". ` +
      `Not independently re-verified by NADC.`;

    if (!apply) {
      if (inserted < 12) {
        console.log(
          `[${tier.toUpperCase()}] ${f.name} — ${f.location?.city ?? "?"}, ${state} · ` +
            `${domainCount} domains · ${capacity ?? "capacity TBD"}`
        );
      }
      inserted++;
      continue;
    }

    await pool.query(
      `INSERT INTO projects
         (slug, name, developer, city, county, state, latitude, longitude,
          status, status_detail, capacity, investment, notes, sources,
          verification_tier, verification_note, published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT (state, slug) DO UPDATE SET
         sources = EXCLUDED.sources,
         verification_note = EXCLUDED.verification_note,
         developer = COALESCE(projects.developer, EXCLUDED.developer),
         capacity  = COALESCE(projects.capacity, EXCLUDED.capacity),
         updated_at = now()`,
      [
        slugify(`${f.name}-${f.location?.city ?? ""}`),
        f.name,
        f.operator ?? null,
        f.location?.city ?? null,
        f.location?.county ?? null,
        state,
        f.location?.lat ?? null,
        f.location?.lon ?? null,
        STATUS_MAP[f.status] ?? "proposed",
        f.status === "permitted" ? "Permitted (per Compute Atlas)" : null,
        capacity,
        investment,
        f.notes ?? null,
        JSON.stringify(sources),
        tier,
        note,
        published,
      ]
    );
    inserted++;
  }

  await pool.end();

  console.log(
    `\nIn scope: ${counts.corroborated + counts.lead} · ` +
      `corroborated/published ${counts.corroborated} · lead/unpublished ${counts.lead}`
  );
  console.log(
    `Skipped: ${counts.dupe} likely duplicates of existing entries, ` +
      `${counts.rumored} rumored, ${counts.noState} unusable (no state/sources), ` +
      `${counts.outOfScope} out of scope.`
  );
  if (!apply) console.log("\nDRY RUN — nothing written. Re-run with --apply.");
  else console.log(`\nApplied. ${inserted} rows written.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
