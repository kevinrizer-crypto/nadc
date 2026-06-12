# NADC — MVP Launch Plan & Phased Ramp-Up

*Written in plain English. The goal: get a credible, working site live for $0/month,
prove people care, then add money and muscle in phases as interest (and revenue) shows up.*

---

## The big idea

You don't need payments, texting, or merch to generate social interest. You need
three things working on day one:

1. **The tracker** — people search the moment they hear a rumor about their town.
2. **The tip line** — turns those visitors into your data pipeline.
3. **The email list** — turns them into an audience you own.

Everything else (donations, store, SMS, petitions) can wait until there's an
audience to monetize. The site is already built to handle this gracefully — any
feature without its account connected shows an honest "not live yet" message
instead of breaking.

---

## Phase 1 — MVP: Go live for $0/month (one weekend of setup)

**Monthly cost: $0.** Everything below has a free tier that comfortably covers a
new site. The only money already spent is your domain renewals (~$25/year, sunk).

| # | Step | What it is | Time | Cost |
|---|------|-----------|------|------|
| 1 | Create the database | Free account at supabase.com — this is where the tracker, tips, and subscribers live. Free tier: 500MB, plenty for years of this data. | 20 min | $0 |
| 2 | Put the site online | Free account at vercel.com, connect it to your GitHub copy of this code. It auto-builds and gives you a live URL. | 30 min | $0 |
| 3 | Connect your domains through Cloudflare | Free Cloudflare account; point both domains there. This gives you security (DDoS protection, hiding your server), the automatic ".com → nadc.info" redirect, and free bot protection (Turnstile) for the forms. | 45 min | $0 |
| 4 | Set up email sending | Free account at resend.com (3,000 emails/month free). This unlocks three things at once: newsletter signups (with the legally-required confirmation step), tip-line confirmation emails, and **your own admin login** (it emails you a sign-in link). | 30 min | $0 |
| 5 | The credibility pass | Spend an afternoon in the admin panel: open each of the 30 tracker entries, click its source link, confirm the status is still right, hit "mark verified." This is the single most important launch task — the site's whole pitch is that it's verified. | 2–3 hrs | $0 |
| 6 | Decide what to show | Recommended for MVP: keep **Home, Learn, Tracker, Organize, News, About** front and center. Donate and Store pages work but say "not live yet" at checkout — we can hide them from the menu until Phase 2 if you prefer (5-minute change, just say the word). | — | $0 |
| 7 | Soft launch | Submit the site to Google (free Search Console account), then start the organic playbook from your marketing strategy doc: share specific tracker pages in the Facebook groups, subreddits, and Nextdoor threads of towns with active fights. Lead with the local page, not the homepage — "here's everything documented about the [X] proposal, with sources." | ongoing | $0 |

**What you skip in Phase 1 and why:**
- **SMS/texting** — requires carrier registration that takes weeks, needs a legal entity, and has monthly fees. Zero benefit until you have an audience.
- **Donations** — Stripe needs a legal entity and bank account. Also: asking for money before you've shown value undercuts the credibility positioning.
- **Store** — Printful is free to set up but pointless without traffic.
- **Officials lookup** — actually free (Geocodio's free tier), so connect it whenever; it's a 10-minute, $0 step. Fine to do in Phase 1 if you want one more "wow" feature.

**What "success" looks like before moving to Phase 2** (borrowed from your strategy doc):
a few hundred email subscribers, tips arriving weekly, one or two tracker pages
ranking on Google for "[town] data center," and at least one local group or
journalist citing the site.

---

## Phase 2 — Turn on the money (when interest is proven, ~months 2–4)

**Monthly cost: roughly $20–40/month + per-transaction fees.** Trigger: steady
subscriber growth or a viral local fight.

1. **Form the legal entity** (one-time state filing fee, ~$50–300 depending on
   state — this is the gate for everything money-related). An LLC is fastest;
   convert to or file as a nonprofit later if you pursue 501(c) status. *Don't
   claim tax-deductibility until it's real.*
2. **Stripe donations** — free to set up; they take ~3% per transaction. The
   recurring "Neighbor" membership flow is already built and is the priority
   (predictable revenue, per your strategy doc). Soft-launch it to your most
   engaged subscribers first.
3. **Upgrade hosting** (~$20/month) — Vercel's free tier is for non-commercial
   use; once donations are on, move to the paid plan. (This is also the honest
   reading of their rules, which matters for an org whose brand is integrity.)
4. **Start The Grid** — the weekly roundup email, written in the admin panel.
   Email stays free until ~3,000 sends/month; at, say, 1,000+ subscribers
   weekly you'll graduate to Resend's ~$20/month tier. A good problem.
5. **First petitions** — launch one or two tied to the hottest tracked fights
   (already built; takes minutes in admin).
6. **Officials lookup** if not already on (free).

**Revenue math to keep in mind:** 150 monthly "Neighbors" at $15 ≈ $2,250/month —
which pays for every tool in Phase 2 and 3 roughly twenty times over. The
costs here are trivial compared to list growth; spend your energy on content
and tips, not tooling.

---

## Phase 3 — Scale what works (months 4–9, funded by revenue)

Only add these once recurring donations cover them:

1. **The store** (Printful print-on-demand: $0 monthly, they take their cut per
   order; you set the margin). Needs real product photos and an afternoon of
   product setup. Yard signs are the flagship — they're also free advertising
   in front yards.
2. **SMS alerts** (~$15–50/month all-in at small scale). Start the carrier
   registration (called "10DLC") 4–6 weeks before you want texts flowing — it's
   slow bureaucracy. Texts are the highest-urgency channel ("hearing tomorrow
   night, show up") so this lands right when you have real fights to mobilize.
3. **Small paid tests** — per your strategy doc, only after organic proves the
   hooks: small Facebook/search ads against your best-performing tracker pages
   to find your true cost per subscriber.
4. **Analytics** — free options (Cloudflare Web Analytics) are enough; add
   them in Phase 1 if curious, but don't pay for analytics before Phase 3.

---

## Phase 4 — The bigger product ideas (when there's staff/volunteer capacity)

These are in the original brief as "Phase 2/3 tools" and are real development
projects, not account setups. Prioritize by what users actually ask for:

- **Impact Estimator** — enter a proposed facility's size, get estimated power/
  water/noise ranges with sources. High wow-factor, very citable.
- **Wins & Losses library** — case studies with documents. Great for press and
  organizers; mostly an editorial lift, light on engineering.
- **Local group directory with "find neighbors near you"** — the network layer.
- **Legislation & model-ordinance tracker** — pairs well with state-level fights.
- **Automated alert emails** — right now, alerts by state/ZIP are stored
  preferences you can mail manually; this phase automates "new hearing posted →
  subscribers near that ZIP get an email within the hour."
- **Premium offerings** — research briefings for journalists/municipalities
  (revenue stream three, after donations and store).

---

## Cost summary

| Phase | Monthly cost | One-time | What you get |
|-------|-------------|----------|--------------|
| 1 — MVP | **$0** | $0 | Live site: tracker, content, tips, email list, security |
| 2 — Money | ~$20–40 + ~3% of donations | entity filing $50–300 | Donations (recurring-first), weekly newsletter, petitions |
| 3 — Scale | ~$50–100 | — | Store, SMS alerts, paid acquisition tests |
| 4 — Product | depends | — | Estimator, case-study library, group network, automation |

The through-line: **nothing in Phase 1 costs money, and nothing in later phases
should be turned on before the phase before it has proven itself.** That's the
same logic as your fundraising strategy — organic proves it, low-cost
systematizes it, paid scales it.

---

## What I'd need from you to execute Phase 1

Just the account signups (steps 1–4 above use your email/identity, so I can't
create them for you). Once you hand me the four credentials (database, Vercel,
Cloudflare, Resend), wiring them in and deploying is about an hour of work, and
the verification pass in the admin panel is yours whenever you have an
afternoon. If you want the Store/Donate links hidden from the menu until
Phase 2, say so and I'll add that switch.
