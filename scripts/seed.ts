/**
 * Seeds the database from the verified starting dataset
 * (NADC_tracker_seed_dataset.csv, compiled 2026-06-11) plus the store catalog
 * carried over from the previous site, and the initial admin account.
 *
 *   DATABASE_URL=postgres://... SEED_ADMIN_EMAIL=you@example.org npm run db:seed
 *
 * Idempotent: upserts by (state, slug) / product slug / admin email.
 *
 * Editorial note: every tracker row keeps its source URL and the dataset's
 * compile date as verified_at. Statuses change month to month — re-verify in
 * the admin panel before relying on any entry for organizing decisions.
 */
import "./load-env";
import { Pool } from "pg";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150);
}

// Map the dataset's free-text status to the tracker enum, preserving the
// original phrasing as status_detail.
function mapStatus(raw: string): { status: string; detail: string | null } {
  const s = raw.toLowerCase();
  let status = "proposed";
  if (s.includes("contested") || s.includes("advancing")) status = "contested";
  else if (s.includes("approved")) status = "approved";
  else if (s.includes("withdrawn")) status = "withdrawn";
  else if (s.includes("blocked")) status = "blocked";
  else if (s.includes("cancel")) status = "canceled";
  else if (s.includes("delayed") || s.includes("deferred")) status = "delayed";
  else if (s.includes("proposed")) status = "proposed";
  const detail = raw.trim() !== status.charAt(0).toUpperCase() + status.slice(1) ? raw.trim() : null;
  return { status, detail };
}

// Minimal CSV parser (handles quoted fields with commas).
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

// Store catalog carried over from the previous site. Images are stock
// placeholders pending real product photography — see GO_LIVE_CHECKLIST.md.
const catalog = [
  {
    slug: "custom-yard-sign",
    name: "[TOWN] Against the Data Center — Yard Sign",
    description:
      'High-contrast 18"×24" corrugated plastic yard sign. Customize with your town name. Weather-resistant, UV-stable ink. Ships in 5–7 business days.',
    priceCents: 1800,
    category: "signs",
    imageUrl: "/brand/yard-sign.png",
    customizable: true,
    badge: "Most Popular",
    variants: [],
    sortOrder: 1,
  },
  {
    slug: "nadc-yard-sign",
    name: "NADC Standard Yard Sign",
    description:
      'Official NADC 18"×24" yard sign. "Know What\'s Coming. Have a Say." High-contrast design readable at distance.',
    priceCents: 1500,
    category: "signs",
    imageUrl: "/brand/yard-sign.png",
    customizable: false,
    badge: null,
    variants: [],
    sortOrder: 2,
  },
  {
    slug: "door-hanger-qr",
    name: "Door Hanger with QR Code",
    description:
      "Pack of 50 door hangers linking to NADC's national tracker. QR code routes to your local project page. Full-color, 4\"×11\".",
    priceCents: 2200,
    category: "print",
    imageUrl: null,
    customizable: false,
    badge: null,
    variants: ["Pack of 50", "Pack of 100", "Pack of 250"],
    sortOrder: 3,
  },
  {
    slug: "official-postcards",
    name: "Pre-Addressed Official Postcards",
    description:
      "Pack of 25 postcards pre-addressed to your county planning commission or city council. Fill in your name and mail. Includes postage guide.",
    priceCents: 1400,
    category: "print",
    imageUrl: null,
    customizable: true,
    badge: null,
    variants: ["Pack of 25", "Pack of 50"],
    sortOrder: 4,
  },
  {
    slug: "nadc-tshirt",
    name: "NADC T-Shirt",
    description: '"Big Tech has lobbyists. You have neighbors." Soft ringspun cotton. Available in S–3XL.',
    priceCents: 2800,
    category: "apparel",
    imageUrl: null,
    customizable: false,
    badge: null,
    variants: ["S", "M", "L", "XL", "2XL", "3XL"],
    sortOrder: 5,
  },
  {
    slug: "nadc-hoodie",
    name: "NADC Hoodie",
    description: 'Heavyweight pullover hoodie with the NADC shield. "Know what\'s coming. Have a say." S–3XL.',
    priceCents: 4800,
    category: "apparel",
    imageUrl: null,
    customizable: false,
    badge: null,
    variants: ["S", "M", "L", "XL", "2XL", "3XL"],
    sortOrder: 6,
  },
  {
    slug: "nadc-hat",
    name: "NADC Embroidered Cap",
    description: "Structured cap with the embroidered NADC shield. One size, adjustable.",
    priceCents: 2600,
    category: "apparel",
    imageUrl: null,
    customizable: false,
    badge: null,
    variants: [],
    sortOrder: 7,
  },
  {
    slug: "nadc-tote",
    name: "Canvas Tote",
    description: 'Heavy cotton tote — "Big Tech has lobbyists. You have neighbors." Carry the message to the farmers\' market.',
    priceCents: 2200,
    category: "apparel",
    imageUrl: null,
    customizable: false,
    badge: null,
    variants: [],
    sortOrder: 8,
  },
  {
    slug: "sticker-pack",
    name: "Sticker Pack",
    description: "Set of 5 weatherproof vinyl stickers — shield logo, taglines, and the watchdog mark. For laptops, water bottles, and truck windows.",
    priceCents: 1200,
    category: "accessories",
    imageUrl: null,
    customizable: false,
    badge: "High Margin",
    variants: [],
    sortOrder: 9,
  },
  {
    slug: "enamel-pin",
    name: "Shield Enamel Pin",
    description: "Hard-enamel NADC shield lapel pin. Wear it to the hearing.",
    priceCents: 1000,
    category: "accessories",
    imageUrl: null,
    customizable: false,
    badge: null,
    variants: [],
    sortOrder: 10,
  },
  {
    slug: "organizer-kit",
    name: "Organizer Kit",
    description:
      "10 custom yard signs + 100 door hangers + 50 postcards + organizing guide PDF. Everything you need to launch a neighborhood campaign.",
    priceCents: 14900,
    category: "bundle",
    imageUrl: "/brand/yard-sign.png",
    customizable: true,
    badge: "Best Value",
    variants: [],
    sortOrder: 11,
  },
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });

  // --- Tracker projects -----------------------------------------------------
  const csv = readFileSync(join(__dirname, "..", "NADC_tracker_seed_dataset.csv"), "utf8");
  const [header, ...rows] = parseCsv(csv).filter((r) => r.length > 1);
  const col = (name: string) => header.indexOf(name);

  let seeded = 0;
  for (const r of rows) {
    const name = r[col("project_name")];
    if (!name) continue;
    const state = r[col("state")];
    const { status, detail } = mapStatus(r[col("status")]);
    const lat = parseFloat(r[col("latitude")]);
    const lng = parseFloat(r[col("longitude")]);
    const compiled = r[col("date_compiled")];
    const sources = [{ url: r[col("source_url")], accessedAt: compiled }];

    await pool.query(
      `INSERT INTO projects
        (slug, name, developer, city, county, state, nearest_zip, latitude, longitude,
         status, status_detail, capacity, investment, notes, sources, verified_at,
         verification_note, published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,true)
       ON CONFLICT (state, slug) DO UPDATE SET
         developer=EXCLUDED.developer, city=EXCLUDED.city, county=EXCLUDED.county,
         nearest_zip=EXCLUDED.nearest_zip, latitude=EXCLUDED.latitude, longitude=EXCLUDED.longitude,
         status=EXCLUDED.status, status_detail=EXCLUDED.status_detail, capacity=EXCLUDED.capacity,
         investment=EXCLUDED.investment, notes=EXCLUDED.notes, sources=EXCLUDED.sources,
         verified_at=EXCLUDED.verified_at, verification_note=EXCLUDED.verification_note,
         updated_at=now()`,
      [
        slugify(name),
        name,
        emptyToNull(r[col("developer")]),
        emptyToNull(r[col("city")]),
        emptyToNull(r[col("county")]),
        state,
        emptyToNull(r[col("nearest_zip")]),
        Number.isFinite(lat) ? lat : null,
        Number.isFinite(lng) ? lng : null,
        status,
        detail,
        undisclosedToNull(r[col("capacity")]),
        undisclosedToNull(r[col("investment")]),
        emptyToNull(r[col("notes")]),
        JSON.stringify(sources),
        compiled ? new Date(compiled) : null,
        `Seeded from verified dataset compiled ${compiled}. Re-verify status before citing — several entries change month to month.`,
      ]
    );
    seeded++;
  }
  console.log(`projects: ${seeded} upserted`);

  // --- Store catalog ---------------------------------------------------------
  for (const p of catalog) {
    await pool.query(
      `INSERT INTO products (slug, name, description, price_cents, category, image_url, customizable, badge, variants, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (slug) DO UPDATE SET
         name=EXCLUDED.name, description=EXCLUDED.description, price_cents=EXCLUDED.price_cents,
         category=EXCLUDED.category, image_url=EXCLUDED.image_url, customizable=EXCLUDED.customizable,
         badge=EXCLUDED.badge, variants=EXCLUDED.variants, sort_order=EXCLUDED.sort_order`,
      [p.slug, p.name, p.description, p.priceCents, p.category, p.imageUrl, p.customizable, p.badge, JSON.stringify(p.variants), p.sortOrder]
    );
  }
  console.log(`products: ${catalog.length} upserted`);

  // --- First admin ------------------------------------------------------------
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  if (adminEmail) {
    await pool.query(`INSERT INTO admins (email) VALUES ($1) ON CONFLICT (email) DO NOTHING`, [
      adminEmail.toLowerCase(),
    ]);
    console.log(`admin: ${adminEmail}`);
  } else {
    console.log("admin: SEED_ADMIN_EMAIL not set — add one before using /admin");
  }

  await pool.end();
}

function emptyToNull(s: string | undefined): string | null {
  return s && s.trim() ? s.trim() : null;
}
function undisclosedToNull(s: string | undefined): string | null {
  const v = emptyToNull(s);
  return v && v.toLowerCase() !== "undisclosed" ? v : null;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
