/**
 * Phase C — lead → primary-source verification at scale.
 *
 * For each lead (a candidate project name + rough location), Claude Opus 4.8
 * uses the server-side web search tool to find primary or local-news sources,
 * extracts structured facts, and proposes a tier. The script then INDEPENDENTLY
 * validates every URL Claude returned (must actually resolve) and re-derives
 * the tier from the count of reachable, independent-domain sources — so a
 * hallucinated or dead citation can never get a project published.
 *
 *   ANTHROPIC_API_KEY=... DATABASE_URL=... npx tsx scripts/verify-leads.ts            # dry run
 *   ANTHROPIC_API_KEY=... DATABASE_URL=... npx tsx scripts/verify-leads.ts --apply    # writes
 *   ... npx tsx scripts/verify-leads.ts --limit 3                                     # cap leads (cost control)
 *
 * Tiering (re-derived in code, never just trusting the model):
 *   ≥2 reachable sources from independent domains + exists  → corroborated, PUBLISHED
 *   exactly 1 reachable source + exists                     → lead, held UNPUBLISHED
 *   0 reachable sources, or model says reject/!exists       → skipped (logged)
 *
 * Honesty contract: web search returns real, cited results; we additionally
 * HEAD/GET-check each URL. Nothing publishes on an unverifiable source.
 */
import Anthropic from "@anthropic-ai/sdk";
import { Pool } from "pg";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MODEL = "claude-opus-4-8";

// ---------------------------------------------------------------------------
// CSV + helpers
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

/** Validate a URL actually resolves. HEAD first, GET fallback. */
async function urlReachable(url: string): Promise<boolean> {
  for (const method of ["HEAD", "GET"] as const) {
    try {
      const res = await fetch(url, {
        method,
        redirect: "follow",
        signal: AbortSignal.timeout(12000),
        headers: { "User-Agent": "Mozilla/5.0 (NADC source verification)" },
      });
      if (res.status < 400) return true;
      if (res.status === 405 && method === "HEAD") continue; // method not allowed → try GET
    } catch {
      /* try next method */
    }
  }
  return false;
}

async function geocodeZip(zip: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const data = await res.json();
    const p = data.places?.[0];
    return p ? { lat: parseFloat(p.latitude), lng: parseFloat(p.longitude) } : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Verdict schema (custom client tool)
// ---------------------------------------------------------------------------

const submitVerdict: Anthropic.Tool = {
  name: "submit_verdict",
  description:
    "Report your verification findings for this data center project after searching the web. Call this exactly once, when you are done searching.",
  input_schema: {
    type: "object",
    properties: {
      exists: { type: "boolean", description: "Is there credible evidence this specific data center project is real?" },
      status: {
        type: "string",
        enum: ["proposed", "contested", "approved", "under_construction", "operating", "withdrawn", "blocked", "canceled", "delayed", "unknown"],
      },
      developer: { type: "string" },
      city: { type: "string" },
      county: { type: "string" },
      state: { type: "string", description: "2-letter US state code" },
      nearestZip: { type: "string" },
      latitude: { type: "number" },
      longitude: { type: "number" },
      capacity: { type: "string", description: "e.g. '500 MW' or '1.2M sq ft' if reported" },
      investment: { type: "string", description: "e.g. '$2B' if reported" },
      summary: { type: "string", description: "<=600 chars, neutral, sourced facts only" },
      sources: {
        type: "array",
        description: "ONLY real URLs that appeared in your web search results. Never invent or guess a URL.",
        items: {
          type: "object",
          properties: {
            url: { type: "string" },
            publisher: { type: "string" },
            kind: { type: "string", enum: ["primary", "local_news", "national_news", "trade", "other"] },
            confirms: { type: "string", description: "what this source confirms about the project" },
          },
          required: ["url", "publisher", "kind"],
        },
      },
      recommendation: { type: "string", enum: ["corroborated", "lead", "reject"] },
      reasoning: { type: "string" },
    },
    required: ["exists", "status", "summary", "sources", "recommendation"],
  },
};

type Verdict = {
  exists: boolean;
  status: string;
  developer?: string;
  city?: string;
  county?: string;
  state?: string;
  nearestZip?: string;
  latitude?: number;
  longitude?: number;
  capacity?: string;
  investment?: string;
  summary: string;
  sources: { url: string; publisher: string; kind: string; confirms?: string }[];
  recommendation: "corroborated" | "lead" | "reject";
  reasoning?: string;
};

const SYSTEM = `You are a fact-checker for Neighbors Against Data Centers, a credibility-first watchdog. Your job: confirm whether a specific proposed/under-construction/operating US data center project is real, and gather citable sources.

Rules — non-negotiable:
- Use the web_search tool to find evidence. Prefer PRIMARY sources (county/city planning agendas, zoning filings, utility commission dockets, official press releases) and established LOCAL NEWS. Trade press (Data Center Dynamics, etc.) counts as supporting.
- ONLY report URLs that actually appeared in your search results and that you are confident exist. NEVER invent, guess, or construct a URL. A fabricated source is the worst possible outcome.
- Extract only facts the sources support. Leave a field empty rather than guessing. If sources disagree, prefer the most recent primary source and note the discrepancy in the summary.
- recommendation: "corroborated" if 2+ INDEPENDENT reputable sources (different organizations) confirm the project exists; "lead" if only 1 credible source; "reject" if you cannot find credible evidence it exists or sources contradict it.
- When done searching, call submit_verdict exactly once.`;

// ---------------------------------------------------------------------------
// Per-lead verification
// ---------------------------------------------------------------------------

async function verifyLead(
  client: Anthropic,
  lead: { name: string; city: string; state: string; hint: string }
): Promise<{ verdict: Verdict | null; usage: { input: number; output: number } }> {
  const userPrompt = `Verify this candidate data center project and gather sources:

Name: ${lead.name}
${lead.city ? `City: ${lead.city}\n` : ""}${lead.state ? `State: ${lead.state}\n` : ""}${lead.hint ? `Context: ${lead.hint}\n` : ""}
Search the web for primary sources and local news, then call submit_verdict.`;

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: userPrompt }];
  const usage = { input: 0, output: 0 };

  for (let turn = 0; turn < 6; turn++) {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      system: SYSTEM,
      tools: [{ type: "web_search_20260209", name: "web_search" } as unknown as Anthropic.Tool, submitVerdict],
      messages,
    });
    usage.input += resp.usage.input_tokens;
    usage.output += resp.usage.output_tokens;

    // Server-side web search exceeded its internal loop — resume.
    if (resp.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: resp.content });
      continue;
    }

    const verdictBlock = resp.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "submit_verdict"
    );
    if (verdictBlock) return { verdict: verdictBlock.input as Verdict, usage };

    // Model stopped without submitting — nudge it once.
    if (resp.stop_reason === "end_turn") {
      messages.push({ role: "assistant", content: resp.content });
      messages.push({ role: "user", content: "Call submit_verdict now with your findings (or recommendation 'reject' if you found nothing credible)." });
      continue;
    }

    messages.push({ role: "assistant", content: resp.content });
  }
  return { verdict: null, usage };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  const apply = process.argv.includes("--apply");
  const limitArg = process.argv.indexOf("--limit");
  const limit = limitArg >= 0 ? parseInt(process.argv[limitArg + 1], 10) : Infinity;

  const client = new Anthropic();
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });

  const csv = readFileSync(join(process.cwd(), "content", "leads.csv"), "utf8");
  const [header, ...rows] = parseCsv(csv).filter((r) => r.length > 1);
  const col = (n: string) => header.indexOf(n);
  const leads = rows
    .map((r) => ({ name: r[col("name")]?.trim(), city: r[col("city")]?.trim() ?? "", state: r[col("state")]?.trim() ?? "", hint: r[col("hint")]?.trim() ?? "" }))
    .filter((l) => l.name)
    .slice(0, limit);

  console.log(`Verifying ${leads.length} leads with ${MODEL} + web search...\n`);
  const totalUsage = { input: 0, output: 0 };
  const summary = { corroborated: 0, lead: 0, rejected: 0, failed: 0 };

  for (const lead of leads) {
    process.stdout.write(`• ${lead.name} … `);
    let verdict: Verdict | null = null;
    try {
      const r = await verifyLead(client, lead);
      verdict = r.verdict;
      totalUsage.input += r.usage.input;
      totalUsage.output += r.usage.output;
    } catch (err) {
      console.log(`ERROR: ${(err as Error).message}`);
      summary.failed++;
      continue;
    }
    if (!verdict) {
      console.log("no verdict returned");
      summary.failed++;
      continue;
    }

    // Validate every source URL actually resolves; count independent domains.
    const validSources: { url: string; label: string; accessedAt: string }[] = [];
    const domains = new Set<string>();
    for (const s of verdict.sources ?? []) {
      if (!/^https?:\/\//.test(s.url)) continue;
      if (await urlReachable(s.url)) {
        validSources.push({ url: s.url, label: `${s.publisher}${s.confirms ? " — " + s.confirms : ""}`.slice(0, 200), accessedAt: new Date().toISOString().slice(0, 10) });
        try {
          domains.add(new URL(s.url).hostname.replace(/^www\./, ""));
        } catch {
          /* ignore */
        }
      }
    }

    // Re-derive tier from validated evidence (conservative vs. the model).
    let tier: "corroborated" | "lead" | "reject";
    if (!verdict.exists || verdict.recommendation === "reject" || domains.size === 0) tier = "reject";
    else if (domains.size >= 2) tier = "corroborated";
    else tier = "lead";

    const claimed = (verdict.sources ?? []).length;
    console.log(
      `${tier.toUpperCase()} (exists=${verdict.exists}, ${validSources.length}/${claimed} sources reachable, ${domains.size} domains)`
    );

    if (tier === "reject") {
      summary.rejected++;
      continue;
    }
    summary[tier === "corroborated" ? "corroborated" : "lead"]++;

    // No fuzzy merge: program names like "Stargate" span multiple distinct
    // campuses, so name-similarity merging pollutes the wrong entry's sources.
    // We insert by slug (state+slug unique). True same-site-different-name
    // duplicates are rare and a human merges them in admin — far safer than
    // auto-merging distinct sites.
    const state = (verdict.state ?? lead.state ?? "").toUpperCase().slice(0, 2);

    let coords: { lat: number; lng: number } | null =
      verdict.latitude != null && verdict.longitude != null ? { lat: verdict.latitude, lng: verdict.longitude } : null;
    if (!coords && verdict.nearestZip) coords = await geocodeZip(verdict.nearestZip);

    const sourcesJson = JSON.stringify(validSources);
    const note = `Phase C automated verification (${MODEL} + web search) on ${new Date().toISOString().slice(0, 10)}. ${domains.size} independent reachable sources. ${verdict.reasoning ?? ""}`.slice(0, 800);

    if (!apply) continue;

    await pool.query(
      `INSERT INTO projects
         (slug, name, developer, city, county, state, nearest_zip, latitude, longitude,
          status, status_detail, capacity, investment, notes, sources,
          verification_tier, verification_note, published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       ON CONFLICT (state, slug) DO UPDATE SET
         sources = EXCLUDED.sources, verification_note = EXCLUDED.verification_note,
         developer = COALESCE(projects.developer, EXCLUDED.developer),
         capacity = COALESCE(projects.capacity, EXCLUDED.capacity), updated_at = now()`,
      [
        slugify(lead.name),
        lead.name,
        verdict.developer ?? null,
        verdict.city ?? lead.city ?? null,
        verdict.county ?? null,
        state,
        verdict.nearestZip ?? null,
        coords?.lat ?? null,
        coords?.lng ?? null,
        ["proposed", "contested", "approved", "under_construction", "operating", "withdrawn", "blocked", "canceled", "delayed"].includes(verdict.status) ? verdict.status : "proposed",
        null,
        verdict.capacity ?? null,
        verdict.investment ?? null,
        verdict.summary ?? null,
        sourcesJson,
        tier, // 'corroborated' or 'lead'
        note,
        tier === "corroborated", // publish corroborated; leads stay unpublished
      ]
    );
  }

  const cost = (totalUsage.input / 1e6) * 5 + (totalUsage.output / 1e6) * 25;
  console.log(`\n=== SUMMARY ===`);
  console.log(`corroborated (published): ${summary.corroborated}`);
  console.log(`lead (held unpublished):  ${summary.lead}`);
  console.log(`rejected:                 ${summary.rejected}`);
  console.log(`failed:                   ${summary.failed}`);
  console.log(`tokens: ${totalUsage.input} in / ${totalUsage.output} out  (~$${cost.toFixed(2)} model cost, excl. web search fees)`);
  if (!apply) console.log(`\nDRY RUN — nothing written. Re-run with --apply to persist.`);

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
