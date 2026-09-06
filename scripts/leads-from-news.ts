/**
 * Turns the news queue into candidate leads for scripts/verify-leads.ts.
 *
 *   npx tsx scripts/leads-from-news.ts             # preview, writes nothing
 *   npx tsx scripts/leads-from-news.ts --write     # write content/leads.csv
 *
 * Local reporting is the densest free source of *proposed* data centers in the
 * country — a story about a rezoning hearing names a specific site months
 * before it appears in any dataset. This script mines the headlines already
 * sitting in news_items and emits (name, hint) rows; city and state are left
 * blank on purpose, because verify-leads resolves them by web search and its
 * answer is better than anything a regex would guess.
 *
 * Precision here matters less than it looks. verify-leads independently
 * resolves every URL Claude returns and re-derives the tier from reachable
 * independent domains, so a bad candidate is dropped as "skipped" rather than
 * published. A noisy input list costs API calls, not credibility.
 */
import "./load-env";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";

/** Headlines about policy, opinion or national trends name no specific site. */
const EXCLUDE =
  /\b(lawmakers?|legislature|legislation|bill|senate|house of|governor|senator|congress|opinion|column|editorial|explained|analysis|nationwide|statewide|across the|report says|study finds|stocks?|earnings|shares|investors?|IPO|ETF)\b/i;

/** Signals that a specific project is actually at issue. */
const INCLUDE =
  /\b(rezon\w*|proposed?|proposal|approv\w*|deni\w*|reject\w*|plans?|planned|construction|campus|site|hearing|permit\w*|zoning|special use|conditional use|annexation|moratorium|lawsuit|sue[sd]?)\b/i;

/** Ordered most-specific first; the first hit wins. */
const PLACE_PATTERNS: RegExp[] = [
  /\b([A-Z][a-zA-Z.'-]+(?:\s+[A-Z][a-zA-Z.'-]+)?)\s+(?:City Council|Town Council|Board of Supervisors|Planning Commission|County Commission(?:ers)?|Township|Borough)\b/,
  /\bdata cent(?:er|re)s?\s+(?:in|near|at|outside|planned for)\s+([A-Z][a-zA-Z.'-]+(?:\s+[A-Z][a-zA-Z.'-]+){0,2})/,
  /\b([A-Z][a-zA-Z.'-]+(?:\s+[A-Z][a-zA-Z.'-]+)?)\s+[Cc]ounty\b/,
  /\b([A-Z][a-zA-Z.'-]+(?:\s+[A-Z][a-zA-Z.'-]+)?)\s+data cent(?:er|re)/,
];

/**
 * A bare state name means a statewide policy story, not a site. Matched against
 * the WHOLE extracted place, never the first word — "Wisconsin Rapids" is a
 * real city and must survive.
 */
const US_STATES = new Set(
  ("Alabama Alaska Arizona Arkansas California Colorado Connecticut Delaware Florida Georgia Hawaii Idaho " +
    "Illinois Indiana Iowa Kansas Kentucky Louisiana Maine Maryland Massachusetts Michigan Minnesota " +
    "Mississippi Missouri Montana Nebraska Nevada Ohio Oklahoma Oregon Pennsylvania Tennessee Texas Utah " +
    "Vermont Virginia Washington Wisconsin Wyoming").split(" ")
);

/** Words that look like places to the patterns above but aren't. */
const NOT_A_PLACE =
  /^(The|A|An|This|That|New|Data|Center|Centre|Big|More|Why|How|What|When|Where|First|Next|Amazon|Google|Meta|Microsoft|Oracle|OpenAI|Council|County|Board|City|State|Residents?|Local|Company|Project|Plan)$/i;

function extractPlace(title: string): string | null {
  for (const re of PLACE_PATTERNS) {
    const m = title.match(re);
    if (!m) continue;
    const place = m[1].trim().replace(/[.,'"]+$/, "");
    const first = place.split(/\s+/)[0];
    if (NOT_A_PLACE.test(first) || place.length < 3) continue;
    if (US_STATES.has(place)) continue;
    return place;
  }
  return null;
}

function csvCell(s: string): string {
  return `"${s.replace(/"/g, '""')}"`;
}

async function main() {
  const write = process.argv.includes("--write");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set (see scripts/load-env.ts)");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

  // Rejected items were judged not worth showing; everything else is fair game
  // as a research lead, whether or not it has been approved for display.
  const { rows } = await pool.query<{ title: string; publisher: string | null; url: string }>(
    `select title, publisher, url from news_items where status <> 'rejected' order by published_at desc nulls last`
  );
  await pool.end();

  const seen = new Set<string>();
  const leads: { name: string; hint: string }[] = [];
  let noPlace = 0;
  let filtered = 0;

  for (const row of rows) {
    const title = row.title;
    if (EXCLUDE.test(title) || !INCLUDE.test(title)) {
      filtered++;
      continue;
    }
    const place = extractPlace(title);
    if (!place) {
      noPlace++;
      continue;
    }
    const name = `${place} data center`;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    leads.push({
      name,
      // The headline and outlet are the whole point of the hint: they give the
      // model a real, checkable starting point rather than a bare place name.
      hint: `${title}${row.publisher ? ` (${row.publisher})` : ""}`,
    });
  }

  console.log(
    `${rows.length} news items → ${leads.length} candidate leads ` +
      `(${filtered} filtered as policy/opinion, ${noPlace} had no extractable place).`
  );

  if (!write) {
    console.log("\nPREVIEW — nothing written. Re-run with --write.\n");
    for (const l of leads.slice(0, 20)) console.log(`  · ${l.name}  ←  ${l.hint.slice(0, 88)}`);
    if (leads.length > 20) console.log(`  … and ${leads.length - 20} more`);
    return;
  }

  const path = join(process.cwd(), "content", "leads.csv");
  const csv = ["name,city,state,hint", ...leads.map((l) => `${csvCell(l.name)},,,${csvCell(l.hint)}`)].join("\n");
  writeFileSync(path, `${csv}\n`, "utf8");
  console.log(`\nWrote ${leads.length} leads to content/leads.csv.`);
  console.log("Next (costs Anthropic credits — start small):");
  console.log("  ANTHROPIC_API_KEY=… npx tsx scripts/verify-leads.ts --limit 5");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
