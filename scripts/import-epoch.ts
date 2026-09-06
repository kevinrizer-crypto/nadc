/**
 * Imports Epoch AI's Frontier Data Centers dataset (CC-BY 4.0) into the
 * tracker. Attribution: "Epoch AI, Frontier Data Centers" — required by the
 * license and attached as a source on every imported row.
 *
 *   DATABASE_URL=... npx tsx scripts/import-epoch.ts            # dry run (prints plan)
 *   DATABASE_URL=... npx tsx scripts/import-epoch.ts --apply    # writes to DB
 *
 * Behavior:
 * - US facilities only. Addresses geocoded via the US Census geocoder
 *   (free, no key). Rows that fail geocoding import without coordinates
 *   (table-only; no map marker).
 * - Dedupe: an Epoch row matches an existing project when they're in the
 *   same state AND (name/owner token overlap OR coordinates within ~20 km).
 *   Matches ENRICH the existing entry (add Epoch source, fill empty fields)
 *   and never downgrade its tier or overwrite human-entered data.
 * - New rows import as tier "corroborated", published: Epoch's per-facility
 *   source lists carry multiple independent references (permits, filings,
 *   news, satellite analysis), which meets the 2+-sources bar.
 * - Re-runnable: subsequent runs update Epoch-managed fields only.
 */
import "./load-env";
import { Pool } from "pg";
import { writeFileSync } from "node:fs";

const EPOCH_CSV_URL = "https://epoch.ai/data/data_centers/data_centers.csv";
const EPOCH_ATTRIBUTION = "Epoch AI, Frontier Data Centers (CC-BY 4.0)";
const EPOCH_URL = "https://epoch.ai/data/data-centers";

// ---------------------------------------------------------------------------

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') (field += '"'), i++;
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") row.push(field), (field = "");
    else if (c === "\n" || c === "\r") {
      if (field !== "" || row.length) row.push(field), rows.push(row), (row = []), (field = "");
      if (c === "\r" && text[i + 1] === "\n") i++;
    } else field += c;
  }
  if (field !== "" || row.length) row.push(field), rows.push(row);
  return rows;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 150);
}

/** Strips Epoch's confidence annotations, e.g. "Meta #confident" → "Meta". */
function cleanField(s: string | undefined): string | null {
  const v = (s ?? "").replace(/#\w+/g, "").trim();
  return v || null;
}

/** Parses "- [label](url)" markdown lines into source objects. */
function parseSources(md: string): { url: string; label?: string; accessedAt: string }[] {
  const today = new Date().toISOString().slice(0, 10);
  const out: { url: string; label?: string; accessedAt: string }[] = [];
  for (const m of md.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g)) {
    out.push({ url: m[2], label: m[1].trim(), accessedAt: today });
  }
  return out;
}

const STATE_NAMES: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS", missouri: "MO",
  montana: "MT", nebraska: "NE", nevada: "NV", "new hampshire": "NH", "new jersey": "NJ",
  "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND", ohio: "OH",
  oklahoma: "OK", oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI", wyoming: "WY",
};

function extractStateZip(addressRaw: string): { state: string | null; zip: string | null; city: string | null } {
  const address = addressRaw.replace(/,?\s*(USA|United States)\s*$/i, "").trim();
  // "..., City, ST 12345"
  let m = address.match(/,\s*([^,]+?),\s*([A-Z]{2})\s+(\d{5})(?:-\d{4})?\s*$/);
  if (m) return { city: m[1].trim(), state: m[2], zip: m[3] };
  m = address.match(/\b([A-Z]{2})\s+(\d{5})(?:-\d{4})?\s*$/);
  if (m) return { city: address.match(/,\s*([^,]+?),\s*[A-Z]{2}\s+\d{5}/)?.[1]?.trim() ?? null, state: m[1], zip: m[2] };
  // "..., City, ST" (no ZIP)
  m = address.match(/,\s*([^,]+?),\s*([A-Z]{2})\s*$/);
  if (m && STATE_NAMES[Object.keys(STATE_NAMES).find((n) => STATE_NAMES[n] === m![2]) ?? ""])
    return { city: m[1].trim(), state: m[2], zip: null };
  // Full state name anywhere, e.g. "Ridgeland, Mississippi" / "Goodyear, Arizona 85338"
  const lower = address.toLowerCase();
  for (const [name, code] of Object.entries(STATE_NAMES).sort((a, b) => b[0].length - a[0].length)) {
    const idx = lower.lastIndexOf(name);
    const beforeOk = idx === 0 || /[^a-z]/.test(lower[idx - 1] ?? " ");
    const afterOk = idx + name.length >= lower.length || /[^a-z]/.test(lower[idx + name.length]);
    if (idx >= 0 && beforeOk && afterOk) {
      const zip = address.match(/\b(\d{5})(?:-\d{4})?\b/)?.[1] ?? null;
      // City heuristic: the word(s) just before the state name, minus punctuation.
      const before = address.slice(0, idx).replace(/[,\s]+$/, "");
      const city = before.split(",").pop()?.trim().split(/\s{2,}/).pop()?.trim() || null;
      return { city: city && city.length <= 40 ? city : null, state: code, zip };
    }
  }
  return { city: null, state: null, zip: null };
}

/** ZIP-centroid fallback (zippopotam.us — GeoNames data, CC-BY). Approximate, fine for a national map. */
async function geocodeZip(zip: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const data = await res.json();
    const place = data.places?.[0];
    return place ? { lat: parseFloat(place.latitude), lng: parseFloat(place.longitude) } : null;
  } catch {
    return null;
  }
}

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  const url = new URL("https://geocoding.geo.census.gov/geocoder/locations/onelineaddress");
  url.searchParams.set("address", address);
  url.searchParams.set("benchmark", "Public_AR_Current");
  url.searchParams.set("format", "json");
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const data = await res.json();
    const match = data.result?.addressMatches?.[0]?.coordinates;
    return match ? { lat: match.y, lng: match.x } : null;
  } catch {
    return null;
  }
}

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function tokens(s: string): Set<string> {
  const stop = new Set(["data", "center", "centers", "campus", "the", "of", "llc", "inc"]);
  return new Set(
    s.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2 && !stop.has(t))
  );
}

function tokenOverlap(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  let n = 0;
  for (const t of ta) if (tb.has(t)) n++;
  return n;
}

// ---------------------------------------------------------------------------

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  const apply = process.argv.includes("--apply");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });

  console.log(`Fetching ${EPOCH_CSV_URL} ...`);
  const csvRes = await fetch(EPOCH_CSV_URL);
  if (!csvRes.ok) throw new Error(`Epoch CSV fetch failed: ${csvRes.status}`);
  const csvText = await csvRes.text();
  writeFileSync("/tmp/epoch_data_centers.csv", csvText); // audit copy

  const [header, ...rows] = parseCsv(csvText).filter((r) => r.length > 1);
  const col = (name: string) => header.indexOf(name);
  const usRows = rows.filter((r) => r[col("Country")] === "United States" && r[0]?.trim());
  console.log(`Epoch rows: ${rows.length} total, ${usRows.length} US`);

  const { rows: existing } = await pool.query(
    `SELECT id, name, developer, state, nearest_zip, latitude, longitude, capacity, investment, sources, verification_tier, notes FROM projects`
  );

  type Plan = { kind: "enrich" | "insert" | "skip"; epochName: string; detail: string; run?: () => Promise<void> };
  const plan: Plan[] = [];

  for (const r of usRows) {
    const name = r[0].trim();
    const owner = cleanField(r[col("Owner")]);
    const users = cleanField(r[col("Users")]);
    const powerMw = parseFloat(r[col("Current power (MW)")]);
    const capCostB = parseFloat(r[col("Current total capital cost (2025 USD billions)")]);
    const address = (r[col("Address")] ?? "").trim();
    const sources = parseSources(r[col("Selected Sources")] ?? "");
    sources.unshift({ url: EPOCH_URL, label: EPOCH_ATTRIBUTION, accessedAt: new Date().toISOString().slice(0, 10) });
    const notes = (r[col("Notes")] ?? "").trim().split("\n")[0].slice(0, 600) || null;

    const { city, state, zip } = address ? extractStateZip(address) : { city: null, state: null, zip: null };
    if (!state) {
      plan.push({ kind: "skip", epochName: name, detail: "no parseable US state in address — held out (re-run after manual fix)" });
      continue;
    }

    let coords = address ? await geocode(address) : null;
    let coordsApprox = false;
    if (!coords && zip) {
      coords = await geocodeZip(zip);
      coordsApprox = coords !== null;
    }

    // Dedupe against existing projects. Same ZIP counts as proximity when
    // street-level geocoding failed.
    const match = existing.find((p) => {
      if (p.state !== state) return false;
      const nameScore = tokenOverlap(name + " " + (owner ?? ""), p.name + " " + (p.developer ?? ""));
      const near =
        coords && p.latitude != null && p.longitude != null
          ? distanceKm(coords.lat, coords.lng, p.latitude, p.longitude) < 20
          : false;
      const sameZip = Boolean(zip && p.nearest_zip && zip === p.nearest_zip);
      return nameScore >= 2 || ((near || sameZip) && nameScore >= 1);
    });

    const capacity = Number.isFinite(powerMw) && powerMw > 0 ? `${Math.round(powerMw)} MW (current, per Epoch AI)` : null;
    const investment = Number.isFinite(capCostB) && capCostB > 0 ? `~$${capCostB.toFixed(1)}B (est. capital cost, 2025 USD, per Epoch AI)` : null;

    if (match) {
      plan.push({
        kind: "enrich",
        epochName: name,
        detail: `→ enriches existing #${match.id} "${match.name}" (${match.state}, tier ${match.verification_tier})`,
        run: async () => {
          // Merge sources by URL; never overwrite human-entered fields.
          const mergedSources = [...(match.sources ?? [])];
          for (const s of sources) if (!mergedSources.some((m: { url: string }) => m.url === s.url)) mergedSources.push(s);
          await pool.query(
            `UPDATE projects SET
               sources = $1,
               capacity = COALESCE(capacity, $2),
               investment = COALESCE(investment, $3),
               latitude = COALESCE(latitude, $4),
               longitude = COALESCE(longitude, $5),
               updated_at = now()
             WHERE id = $6`,
            [JSON.stringify(mergedSources), capacity, investment, coords?.lat ?? null, coords?.lng ?? null, match.id]
          );
        },
      });
      continue;
    }

    const status = Number.isFinite(powerMw) && powerMw > 0 ? "operating" : "under_construction";
    const statusDetail =
      status === "operating" ? "Operating / expanding (per Epoch AI)" : "Under construction (per Epoch AI)";

    plan.push({
      kind: "insert",
      epochName: name,
      detail: `new: ${city ?? "?"}, ${state} ${zip ?? ""} · ${capacity ?? "capacity TBD"} · ${sources.length} sources · coords ${coords ? (coordsApprox ? "approx (ZIP centroid)" : "ok") : "MISSING"}`,
      run: async () => {
        await pool.query(
          `INSERT INTO projects
             (slug, name, developer, city, county, state, nearest_zip, latitude, longitude,
              status, status_detail, capacity, investment, notes, sources,
              verification_tier, verification_note, published)
           VALUES ($1,$2,$3,$4,NULL,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'corroborated',$15,true)
           ON CONFLICT (state, slug) DO UPDATE SET
             capacity = EXCLUDED.capacity, investment = EXCLUDED.investment,
             sources = EXCLUDED.sources, updated_at = now()`,
          [
            slugify(name),
            name,
            owner ?? users,
            city,
            state,
            zip,
            coords?.lat ?? null,
            coords?.lng ?? null,
            status,
            statusDetail,
            capacity,
            investment,
            notes ? `Per Epoch AI: ${notes}` : null,
            JSON.stringify(sources),
            `Imported from ${EPOCH_ATTRIBUTION} on ${new Date().toISOString().slice(0, 10)}. Corroborated by the per-facility sources attached; not yet human-verified.`,
          ]
        );
      },
    });
  }

  console.log("\n=== IMPORT PLAN ===");
  for (const p of plan) console.log(`[${p.kind.toUpperCase()}] ${p.epochName} ${p.detail}`);
  const counts = { insert: 0, enrich: 0, skip: 0 };
  for (const p of plan) counts[p.kind]++;
  console.log(`\nTotals: ${counts.insert} new, ${counts.enrich} enrich existing, ${counts.skip} skipped`);

  if (!apply) {
    console.log("\nDRY RUN — nothing written. Re-run with --apply to execute.");
  } else {
    for (const p of plan) if (p.run) await p.run();
    console.log("\nApplied.");
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
