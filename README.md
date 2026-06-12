# Neighbors Against Data Centers — nadc.info

Nationwide, fact-checked hub turning alarmed neighbors into organized opposition
to harmful data centers. Production full-stack application: national project
tracker (map + database), six sourced pillar articles, tip intake with
moderation, double-opt-in email + SMS alerts, Stripe donations (recurring-first)
and storefront, petitions, write-your-officials, and an authenticated admin panel.

**Canonical domain:** `nadc.info` (`neighborsagainstdatacenters.com` 301s to it).

## Editorial ground rules (enforced in code)

- Public pages only show `published` tracker entries; **publishing requires at least one source** (enforced in the admin action).
- Every tracker page shows a **"last verified"** stamp; entries 60+ days stale are flagged in admin.
- Tips are never auto-published — they enter a moderation queue and can only be promoted to **unpublished drafts**.
- Missing credentials → honest 503 messages. **No simulated emails, texts, or payments, ever.**
- Tipster identity is sensitive: contact info never leaves the admin queue; form IPs are stored only as salted one-way hashes.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router, SSR) | SEO for content + programmatic tracker pages, API routes, server actions |
| Database | PostgreSQL (Supabase/Neon) + Drizzle ORM | Plain SQL migrations in `drizzle/`, typed queries |
| Styling | Tailwind CSS | Tokens derived from brand assets (`#00469C` / `#CC1332` / `#3F403A`, DM Sans/DM Serif Display/DM Mono — continuous with the previous site) |
| Maps | MapLibre GL + OpenFreeMap tiles | Free, no API key, no usage cap |
| Email | Resend (transactional + broadcasts) | One API for double opt-in confirmations and The Grid |
| SMS | Twilio Messaging Service | 10DLC + Advanced Opt-Out; consent mirrored to our DB via webhook |
| Payments | Stripe Checkout (hosted) | Card data never touches our servers (PCI SAQ-A) |
| Bot protection | Cloudflare Turnstile + honeypots + DB-backed rate limits | No Google reCAPTCHA |
| Civic data | Geocodio (`cd` + `stateleg` appends) | Google Civic's representatives API was retired in 2025 |
| Hosting | Vercel/CF Pages behind Cloudflare (WAF, CDN, origin masking) | See `GO_LIVE_CHECKLIST.md` |

## Local development

```bash
npm install
cp .env.example .env.local           # fill in at least DATABASE_URL + AUTH_SECRET + IP_HASH_SALT

# database
npm run db:migrate                   # applies drizzle/*.sql, tracked in _migrations
SEED_ADMIN_EMAIL=you@example.org npm run db:seed   # 30 verified projects + store catalog + first admin

npm run dev                          # http://localhost:3000
```

Without optional credentials, the relevant features return clear "not live yet"
messages: subscriptions/admin-login need `RESEND_API_KEY`; donations/store need
`STRIPE_SECRET_KEY`; officials lookup needs `GEOCODIO_API_KEY`. Turnstile is
skipped (with a console warning) when unset — local dev only.

## Project layout

```
content/            Fact-checked content (source of truth for Learn)
  pillars/*.md      The six pillar articles — key takeaways, FAQ, sources parsed by src/lib/content.ts
  glossary.json     Glossary (carried over from the previous site)
  myths.json        Myth vs. Evidence entries (each cites its source + pillar)
  impacts.json      Homepage impact cards (each cites its source + pillar)
drizzle/            SQL migrations (applied by scripts/migrate.ts)
scripts/            migrate.ts, seed.ts, generate_brand_assets.py (favicon/OG from logo)
src/app/            Routes (public, /api, /admin)
src/components/     UI components
src/db/             Drizzle schema + client
src/lib/            auth, email, sms, stripe, security (rate limit/turnstile/hashing), content, queries
public/brand/       Supplied logo assets; og-image.png + favicons generated from them
NADC_tracker_seed_dataset.csv   Verified seed data (compiled 2026-06-11)
GO_LIVE_CHECKLIST.md            Every external account/registration, in order
```

## Admin

`/admin` — email magic-link auth against the `admins` allowlist (single-use
tokens, 15-min expiry, stored hashed; 8h HttpOnly session JWT). **Production
must also put `/admin*` behind Cloudflare Access for SSO + MFA** (free tier;
see checklist §1). Capabilities: tip moderation → promote-to-draft, full
tracker CRUD with verification stamps and the publish-requires-sources
guardrail, posts (The Grid + analysis), product pricing/availability,
petitions, subscriber/consent view, donations and orders.

To add an admin: `INSERT INTO admins (email) VALUES ('person@example.org');`

## Data pipeline ("live data")

There is no public third-party feed of data center proposals. The tracker is a
staff-maintained database with two inputs:

1. **Tips** (`/report`) → moderation queue → promote to unpublished draft → verify against public records → publish.
2. **Editorial monitoring** → direct entry in `/admin/projects`.

Verification is enforced by convention + tooling: publish requires ≥1 source,
the dashboard surfaces entries not re-verified in 60 days, and every public
page displays its verification date.

## Newsletter sends

Subscriber records and consent live in Postgres (source of truth). For
broadcast sends of The Grid, sync confirmed contacts to Resend Audiences and
send via Resend Broadcasts; every email includes the per-subscriber
unsubscribe link (`/api/unsubscribe?token=…`) and the CAN-SPAM postal address
automatically via `src/lib/email.ts`.

## Security posture

- CSP, HSTS, X-Frame-Options DENY, nosniff, referrer policy — `next.config.ts`.
- All write endpoints: zod validation, DB-backed per-IP rate limits, honeypot, Turnstile.
- Admin: allowlist + single-use hashed magic links + short sessions + (in prod) Cloudflare Access MFA.
- No personal data in URLs (tokens are opaque, single-purpose); IPs stored only as salted hashes.
- Secrets only in env vars; `.env*` is gitignored; nothing sensitive in client bundles (only `NEXT_PUBLIC_*` keys, which are public by design).
- Cloudflare proxy masks origin; WAF + rate limiting at the edge (checklist §1).
- Backups: provider dailies + scripted off-site `pg_dump` (checklist §1).

## Deploy

1. Push to GitHub; import into Vercel (framework auto-detected). Set every env var from `.env.example`.
2. Run migrations + seed against the production DB (`npm run db:migrate && npm run db:seed`).
3. Point DNS at the host **through Cloudflare** (proxied), both domains.
4. Work through `GO_LIVE_CHECKLIST.md` top to bottom — it sequences Cloudflare hardening, Resend, Twilio/10DLC, Stripe, Turnstile, Geocodio, Printful, and the pre-launch verification pass.
