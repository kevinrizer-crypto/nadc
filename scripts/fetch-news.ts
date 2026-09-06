/**
 * News monitor — scans the feeds in content/news-feeds.json for stories about
 * data centers and files anything new into the news_items queue as `pending`.
 *
 *   npx tsx scripts/fetch-news.ts            # dry run — prints, writes nothing
 *   npx tsx scripts/fetch-news.ts --commit   # actually insert
 *
 * Idempotent: news_items.url is UNIQUE and inserts use ON CONFLICT DO NOTHING,
 * so re-running only ever adds genuinely new stories. Safe on a schedule.
 *
 * Nothing this script writes is publicly visible. Items appear on the site only
 * after a human approves them in /admin/news, which is why the feed queries can
 * afford to be broad.
 */
import { readFileSync } from "node:fs";
import { db } from "../src/db";
import { newsItems } from "../src/db/schema";

type Feed = { label: string; url: string; state?: string };
type Item = {
  url: string;
  title: string;
  publisher: string | null;
  summary: string | null;
  publishedAt: Date | null;
  discoveredVia: string;
  state: string | null;
};

/** Strip CDATA wrappers and decode the handful of entities feeds actually use. */
function clean(raw: string | null): string | null {
  if (raw == null) return null;
  let s = raw.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
  s = s.replace(/<[^>]+>/g, " "); // descriptions often carry markup
  s = s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
  return s.replace(/\s+/g, " ").trim() || null;
}

function tag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1] : null;
}

/**
 * Google News titles arrive as "Headline - Publisher". Split off the publisher
 * so the stored title is just the headline.
 */
function splitTitle(title: string, publisher: string | null): { title: string; publisher: string | null } {
  if (publisher) return { title: title.replace(new RegExp(`\\s+-\\s+${publisher}$`), "").trim(), publisher };
  const m = title.match(/^(.*)\s+-\s+([^-]{2,60})$/);
  return m ? { title: m[1].trim(), publisher: m[2].trim() } : { title, publisher: null };
}

function parseFeed(xml: string, feed: Feed): Item[] {
  const blocks = xml.match(/<(item|entry)[\s\S]*?<\/\1>/gi) ?? [];
  const out: Item[] = [];

  for (const block of blocks) {
    // RSS puts the URL in <link>text</link>; Atom uses <link href="...">.
    let url = clean(tag(block, "link"));
    if (!url) url = block.match(/<link[^>]*href=["']([^"']+)["']/i)?.[1] ?? null;
    const rawTitle = clean(tag(block, "title"));
    if (!url || !rawTitle) continue;

    const sourceTag = block.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1] ?? null;
    const { title, publisher } = splitTitle(rawTitle, clean(sourceTag));

    const dateRaw = clean(tag(block, "pubDate")) ?? clean(tag(block, "published")) ?? clean(tag(block, "updated"));
    const parsed = dateRaw ? new Date(dateRaw) : null;

    out.push({
      url,
      title,
      publisher: publisher ?? (() => {
        try {
          return new URL(url).hostname.replace(/^www\./, "");
        } catch {
          return null;
        }
      })(),
      summary: clean(tag(block, "description")) ?? clean(tag(block, "summary")),
      publishedAt: parsed && !Number.isNaN(parsed.getTime()) ? parsed : null,
      discoveredVia: feed.label.slice(0, 120),
      state: feed.state ?? null,
    });
  }
  return out;
}

async function main() {
  const commit = process.argv.includes("--commit");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

  const config = JSON.parse(readFileSync(new URL("../content/news-feeds.json", import.meta.url), "utf8"));
  const feeds: Feed[] = config.feeds ?? [];
  if (feeds.length === 0) throw new Error("No feeds configured in content/news-feeds.json");

  const collected = new Map<string, Item>();
  for (const feed of feeds) {
    try {
      const res = await fetch(feed.url, { headers: { "User-Agent": "NADC news monitor (+https://nadc.info)" } });
      if (!res.ok) {
        console.warn(`  ! ${feed.label}: HTTP ${res.status} — skipped`);
        continue;
      }
      const items = parseFeed(await res.text(), feed);
      console.log(`  ${feed.label}: ${items.length} items`);
      // First feed to surface a URL wins, so discovered_via names the query
      // that actually found it.
      for (const item of items) if (!collected.has(item.url)) collected.set(item.url, item);
    } catch (err) {
      console.warn(`  ! ${feed.label}: ${(err as Error).message} — skipped`);
    }
  }

  // Wire stories are syndicated verbatim across dozens of local stations, so a
  // single lawsuit can arrive as 15 identical headlines. Collapse on normalised
  // title and keep the first. This is safe here in a way that fuzzy matching is
  // NOT safe for tracker projects: the worst case is that a human reviews one
  // copy of a story instead of fifteen, and coverage is a link, not a claim.
  const seenTitles = new Set<string>();
  const all: Item[] = [];
  let collapsed = 0;
  for (const item of collected.values()) {
    const key = item.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (seenTitles.has(key)) {
      collapsed++;
      continue;
    }
    seenTitles.add(key);
    all.push(item);
  }
  console.log(
    `\n${all.length} distinct stories across ${feeds.length} feeds` +
      (collapsed > 0 ? ` (${collapsed} syndicated copies collapsed).` : ".")
  );

  if (!commit) {
    console.log("\nDRY RUN — nothing written. Re-run with --commit to queue these.\n");
    for (const i of all.slice(0, 15)) {
      console.log(`  · [${i.discoveredVia}] ${i.publisher ?? "?"} — ${i.title.slice(0, 90)}`);
    }
    if (all.length > 15) console.log(`  … and ${all.length - 15} more`);
    return;
  }

  let inserted = 0;
  for (const item of all) {
    const rows = await db
      .insert(newsItems)
      .values({
        url: item.url,
        title: item.title,
        publisher: item.publisher,
        summary: item.summary,
        publishedAt: item.publishedAt,
        state: item.state,
        discoveredVia: item.discoveredVia,
      })
      // URL is UNIQUE — this is what makes repeat runs safe.
      .onConflictDoNothing({ target: newsItems.url })
      .returning({ id: newsItems.id });
    if (rows.length > 0) inserted++;
  }

  console.log(`\nQueued ${inserted} new stories (${all.length - inserted} already known).`);
  console.log("Review them at /admin/news — nothing is public until approved.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
