import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { marked } from "marked";

/**
 * Loads the six pillar articles from /content/pillars and parses their
 * consistent structure (title, meta description, key takeaways, body, FAQ,
 * sources) without altering the fact-checked text. The markdown files are
 * the single source of truth for Learn content.
 */

export type PillarFaq = { q: string; a: string };
export type Pillar = {
  slug: string;
  title: string;
  metaDescription: string;
  keyTakeawaysHtml: string;
  bodyHtml: string;
  faqs: PillarFaq[];
  sourcesHtml: string;
  sources: { label: string; url: string }[];
};

// Display order + short labels for nav/cross-linking.
export const PILLAR_ORDER: { slug: string; short: string }[] = [
  { slug: "electricity-rates", short: "Electricity Rates" },
  { slug: "water-usage", short: "Water Usage" },
  { slug: "property-values", short: "Property Values" },
  { slug: "jobs-and-incentives", short: "Jobs & Incentives" },
  { slug: "ndas-and-secrecy", short: "NDAs & Secrecy" },
  { slug: "how-to-fight-playbook", short: "The Playbook" },
];

const dir = join(process.cwd(), "content", "pillars");
let cache: Map<string, Pillar> | null = null;

function renderMd(md: string): string {
  return marked.parse(md, { async: false }) as string;
}

function parsePillar(slug: string, raw: string): Pillar {
  const title = raw.match(/^# (.+)$/m)?.[1]?.trim() ?? slug;
  const metaDescription = raw.match(/\*\*Meta description:\*\*\s*(.+)/)?.[1]?.trim() ?? "";

  // Key takeaways: from the "**Key takeaways**" marker to the first `---`.
  const ktMatch = raw.match(/\*\*Key takeaways\*\*\n([\s\S]*?)\n---/);
  const keyTakeawaysHtml = ktMatch ? renderMd(ktMatch[1].trim()) : "";

  // Body: between the first `---` and `## FAQ`.
  const bodyMatch = raw.match(/\n---\n([\s\S]*?)\n## FAQ/);
  const bodyHtml = bodyMatch ? renderMd(bodyMatch[1].trim()) : "";

  // FAQ: bolded question lines followed by answer paragraphs.
  const faqSection = raw.match(/## FAQ\n([\s\S]*?)(\n---|\n## Sources)/)?.[1] ?? "";
  const faqs: PillarFaq[] = [];
  for (const m of faqSection.matchAll(/\*\*(.+?)\*\*\n([\s\S]*?)(?=\n\*\*|$)/g)) {
    faqs.push({ q: m[1].trim(), a: m[2].trim() });
  }

  // Sources: list items under `## Sources`. Kept verbatim.
  const sourcesMd = raw.match(/## Sources\n([\s\S]*)$/)?.[1]?.trim() ?? "";
  const sources: { label: string; url: string }[] = [];
  for (const m of sourcesMd.matchAll(/^- (.+?):\s*(https?:\/\/\S+)$/gm)) {
    sources.push({ label: m[1].trim(), url: m[2].trim() });
  }
  return { slug, title, metaDescription, keyTakeawaysHtml, bodyHtml, faqs, sourcesHtml: renderMd(sourcesMd), sources };
}

export function getPillars(): Pillar[] {
  if (!cache) {
    cache = new Map();
    for (const f of readdirSync(dir).filter((f) => f.endsWith(".md"))) {
      const slug = f.replace(/\.md$/, "");
      cache.set(slug, parsePillar(slug, readFileSync(join(dir, f), "utf8")));
    }
  }
  return PILLAR_ORDER.map((p) => cache!.get(p.slug)).filter((p): p is Pillar => Boolean(p));
}

export function getPillar(slug: string): Pillar | null {
  getPillars();
  return cache!.get(slug) ?? null;
}

export type GlossaryEntry = { term: string; def: string };
export type MythEntry = { q: string; a: string; source: string; pillar: string };
export type ImpactCard = {
  title: string;
  stat: string;
  statLabel: string;
  detail: string;
  source: string;
  pillar: string;
  icon: string;
};

export function getGlossary(): GlossaryEntry[] {
  return JSON.parse(readFileSync(join(process.cwd(), "content", "glossary.json"), "utf8"));
}
export function getMyths(): MythEntry[] {
  return JSON.parse(readFileSync(join(process.cwd(), "content", "myths.json"), "utf8"));
}
export function getImpacts(): ImpactCard[] {
  return JSON.parse(readFileSync(join(process.cwd(), "content", "impacts.json"), "utf8"));
}

export function renderMarkdown(md: string): string {
  return renderMd(md);
}
