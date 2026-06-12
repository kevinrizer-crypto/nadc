# NADC Go-Live Checklist

Work top to bottom. Each numbered section unlocks a feature; the site runs
and degrades honestly (clear "not live yet" messages, never fake success)
until its credentials exist. Items marked **🔑 owner-only** need accounts
only you can create.

---

## 1. Core infrastructure (everything depends on this)

- [ ] **🔑 Postgres database** — create a project at [Supabase](https://supabase.com) or [Neon](https://neon.tech).
      Copy the **pooled** connection string into `DATABASE_URL`.
- [ ] Run `npm run db:migrate` then `SEED_ADMIN_EMAIL=you@… npm run db:seed`.
- [ ] **Re-verify seed data.** The 30 tracker entries were compiled 2026-06-11.
      Before promoting the site, open each entry in `/admin/projects`, spot-check
      its source link, and click "Mark verified as of today." Statuses change
      monthly — several seed entries (e.g. CyrusOne Springfield, Spalding County)
      were mid-process at compile time.
- [ ] Generate secrets: `openssl rand -hex 32` → `AUTH_SECRET`; `openssl rand -hex 16` → `IP_HASH_SALT`.
- [ ] **🔑 Hosting** — deploy to Vercel (or Cloudflare Pages/Netlify). Set all env vars in the dashboard, never in the repo.
- [ ] **🔑 Cloudflare in front** (required — this org expects hostile traffic):
  - Add both zones (nadc.info, neighborsagainstdatacenters.com); move nameservers to Cloudflare.
  - Proxy (orange-cloud) all DNS records so the origin IP is masked.
  - SSL/TLS → Full (strict). Enable HSTS.
  - Security → WAF: enable managed rules; add rate-limiting rules for `/api/*` (e.g. 30 req/min/IP).
  - Bot Fight Mode on.
  - Redirect rule: `neighborsagainstdatacenters.com/*` → `https://nadc.info/$1` (301). (The app enforces this too, as a backstop.)
  - Registrar: lock both domains, enable 2FA on the registrar and Cloudflare accounts.
- [ ] **🔑 Cloudflare Access in front of `/admin`** (free ≤50 users): Zero Trust → Access →
      add an application for `nadc.info/admin*`, restrict to staff emails, require MFA.
      This is the 2FA layer on top of the app's magic-link auth.
- [ ] **Database backups**: Supabase/Neon include daily backups; additionally schedule
      `pg_dump` to off-site storage (e.g. GitHub Actions cron → encrypted dump → S3/R2).
      Document the restore: `psql $DATABASE_URL < dump.sql`. Test it once.

## 2. Email (unlocks: double opt-in, tip confirmations, admin login, newsletter)

- [ ] **🔑 Resend account** → API key → `RESEND_API_KEY`.
- [ ] Verify sending domain `mail.nadc.info` (add the DKIM/SPF DNS records Resend shows — in Cloudflare, set these records to DNS-only/grey-cloud).
- [ ] Set `EMAIL_FROM`, `ADMIN_NOTIFY_EMAIL`.
- [ ] **CAN-SPAM**: set `ORG_POSTAL_ADDRESS` (a PO box or registered-agent address is fine). Every marketing email footer includes it + unsubscribe automatically.
- [ ] Send yourself a test: subscribe at `/subscribe`, confirm the link works end-to-end.
- [ ] Admin login now works: visit `/admin`, request a magic link.

## 3. SMS (unlocks: text alerts) — has real regulatory lead time, start early

- [ ] **🔑 Twilio account** → `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`.
- [ ] Create a **Messaging Service**; buy a local number into it → `TWILIO_MESSAGING_SERVICE_SID`.
- [ ] **🔑 A2P 10DLC registration** (required by US carriers; takes days–weeks):
  1. Register your **Brand** (legal entity name, EIN — register the nonprofit/LLC first if you haven't).
  2. Register a **Campaign** (use case: "Public Service Announcement" / advocacy alerts).
     Sample messages: hearing alerts. Opt-in description: web form with express
     consent checkbox (the exact language is in `/consent-policy` — Twilio will ask for it).
  3. Attach the campaign to the Messaging Service.
- [ ] Enable **Advanced Opt-Out** on the Messaging Service (STOP/HELP auto-handling).
- [ ] Set the inbound webhook: Messaging Service → Integration → `https://nadc.info/api/sms/inbound` (keeps our consent records in sync).
- [ ] Consent records: already handled — every opt-in stores the exact consent language, timestamp, and IP hash in `consent_events`.

## 4. Payments (unlocks: donations + store)

- [ ] **🔑 Stripe account** (activate with your org's legal/banking details).
- [ ] `STRIPE_SECRET_KEY` (start with test keys; switch to live at launch).
- [ ] Webhook: Dashboard → Developers → Webhooks → endpoint `https://nadc.info/api/stripe/webhook`,
      events `checkout.session.completed` + `customer.subscription.deleted` → copy signing secret to `STRIPE_WEBHOOK_SECRET`.
- [ ] Test in test mode: one-time donation, monthly "Neighbor", store order (card 4242 4242 4242 4242).
- [ ] Stripe emails receipts automatically (Settings → Customer emails → enable for successful payments).
- [ ] If/when you have 501(c) status, add tax-deductibility language to `/donate` — **do not claim it before it's real.**

## 5. Bot protection (hardens: tips, subscribe, petitions)

- [ ] **🔑 Cloudflare Turnstile** → create widget for nadc.info →
      `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`.
      Until set, forms rely on honeypot + rate limiting only (fine for dev, not for launch).

## 6. Civic data (unlocks: write-your-officials lookup)

- [ ] **🔑 Geocodio** ([dash.geocod.io](https://dash.geocod.io)) → `GEOCODIO_API_KEY` (free tier 2,500/day).
      Covers federal + state legislators. County/city contacts are per-project in the tracker (admin-curated).

## 7. Store fulfillment (optional at launch)

- [ ] **🔑 Printful** account + API token → `PRINTFUL_API_KEY`.
- [ ] Create the products in Printful (yard signs, shirts, etc.), then paste each
      sync variant ID into `/admin/products`.
- [ ] Replace placeholder product images with real product photography (`/admin/products` → image URLs; the custom yard-sign uses your real `Yard Sign.png` photo already).
- [ ] Until then: orders collect payment + shipping via Stripe and appear in `/admin/orders` for manual fulfillment.

## 8. Maps

- [ ] Nothing required — tracker uses OpenFreeMap (no key, no cap). Optionally set
      `NEXT_PUBLIC_MAP_STYLE_URL` for MapTiler/Protomaps and update the CSP `connect-src` in `next.config.ts`.

## 9. Pre-launch verification pass

- [ ] Every pillar article: click 3 random source links each, confirm they resolve and support the claim.
- [ ] Tracker: each entry shows a "last verified" date within the past 30 days.
- [ ] Run Lighthouse (mobile): Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95.
- [ ] Submit `https://nadc.info/sitemap.xml` in Google Search Console + Bing Webmaster Tools (**🔑** create accounts; verify via DNS TXT in Cloudflare).
- [ ] Confirm `https://neighborsagainstdatacenters.com` 301s to `https://nadc.info` (curl -I).
- [ ] Confirm `/admin` is unreachable without Cloudflare Access + magic link.
- [ ] Test restore from a real backup dump once.

## 10. Legal/organizational (parallel track)

- [ ] **🔑** Form the legal entity (nonprofit corp or LLC) — needed for Stripe activation, 10DLC brand registration, and the CAN-SPAM postal address.
- [ ] Review `/privacy` and `/consent-policy` with counsel; both are drafted and live but deserve a legal read.
- [ ] Set up `hello@`, `corrections@`, `privacy@`, `volunteer@` mailboxes on nadc.info (e.g. Cloudflare Email Routing → forward to your inbox — free).
