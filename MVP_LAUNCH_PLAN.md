# NADC — MVP Launch Plan & Phased Ramp-Up

*Written in plain English. The goal: get a credible, working site live for nearly
nothing, prove people care, then add muscle in phases as interest (and revenue) shows up.*

> **Update:** the LLC, bank account, and Stripe already exist — so donations
> (the recurring "Neighbor" membership) move into the MVP launch. The only
> Phase 1 cost this adds is honest hosting (see step 2): either $0 on Netlify
> or $20/month on Vercel.

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
| 2 | Put the site online | Connect a hosting account to your GitHub copy of this code; it auto-builds and gives you a live URL. Since donations will be on from day one, use a host whose free tier allows commercial use: **Netlify (free)** is the cheapest honest option; **Vercel Pro ($20/mo)** is the smoothest. Either works — your call. | 30 min | $0–20/mo |
| 3 | Connect your domains through Cloudflare | Free Cloudflare account; point both domains there. This gives you security (DDoS protection, hiding your server), the automatic ".com → nadc.info" redirect, and free bot protection (Turnstile) for the forms. | 45 min | $0 |
| 4 | Set up email sending | Free account at resend.com (3,000 emails/month free). This unlocks three things at once: newsletter signups (with the legally-required confirmation step), tip-line confirmation emails, and **your own admin login** (it emails you a sign-in link). | 30 min | $0 |
| 5 | The credibility pass | Spend an afternoon in the admin panel: open each of the 30 tracker entries, click its source link, confirm the status is still right, hit "mark verified." This is the single most important launch task — the site's whole pitch is that it's verified. | 2–3 hrs | $0 |
| 6 | Turn on donations | Connect the existing Stripe account (two keys: one secret key, plus a "webhook" key created after the site is live — 15 minutes total). The recurring "Neighbor" membership and one-time gifts go live, with Stripe taking ~3% per transaction and no monthly fee. The **Store** stays "not live yet" until Phase 2 — it still needs Printful setup and product photos; we can hide it from the menu until then if you prefer (5-minute change). | 30 min | ~3% per donation |
| 7 | Soft launch | Submit the site to Google (free Search Console account), then start the organic playbook from your marketing strategy doc: share specific tracker pages in the Facebook groups, subreddits, and Nextdoor threads of towns with active fights. Lead with the local page, not the homepage — "here's everything documented about the [X] proposal, with sources." | ongoing | $0 |

**What you skip in Phase 1 and why:**
- **SMS/texting** — requires carrier registration that takes weeks and has monthly fees. Zero benefit until you have an audience. (You have the LLC it requires, so this can start anytime — but there's no rush.)
- **Store** — Printful is free to set up but pointless without traffic, and it needs real product photos.
- **Officials lookup** — actually free (Geocodio's free tier), so connect it whenever; it's a 10-minute, $0 step. Fine to do in Phase 1 if you want one more "wow" feature.

**One launch judgment call on donations:** they're free to have on, but consider
how loudly to feature them in week one. Leading your first social posts with the
tracker ("here's everything documented about your town's proposal") builds the
credibility that makes the donate ask land later. Having the page live but not
promoted is a fine middle ground.

**What "success" looks like before moving to Phase 2** (borrowed from your strategy doc):
a few hundred email subscribers, tips arriving weekly, one or two tracker pages
ranking on Google for "[town] data center," and at least one local group or
journalist citing the site.

---

## Phase 2 — Build the audience engine (when interest is proven, ~months 2–4)

**Monthly cost: roughly $0–40/month.** Trigger: steady subscriber growth or a
viral local fight. *(The legal entity, bank account, and Stripe — formerly this
phase's main work — already exist and moved into Phase 1.)*

1. **Push the recurring "Neighbor" ask** — the strategy doc's most important
   move. Soft-launch the $10–25/month membership to your most engaged
   subscribers first; one-time gifts are unpredictable, sustainers are a budget.
2. **Start The Grid** — the weekly roundup email, written in the admin panel.
   Email stays free until ~3,000 sends/month; at roughly 1,000+ subscribers
   weekly you'll graduate to Resend's ~$20/month tier. A good problem.
3. **First petitions** — launch one or two tied to the hottest tracked fights
   (already built; takes minutes in admin).
4. **Officials lookup** if not already on (free).
5. **Note on taxes:** an LLC's donations are not tax-deductible to donors. The
   site doesn't claim they are. If you later want deductibility, that's a
   501(c)(3)/(c)(4) decision with a lawyer — worth it only once donation volume
   says so.

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
| 1 — MVP | **$0–20** (+ ~3% per donation) | $0 | Live site: tracker, content, tips, email list, donations, security |
| 2 — Audience | ~$0–40 | — | Recurring "Neighbor" push, weekly newsletter, petitions |
| 3 — Scale | ~$50–100 | — | Store, SMS alerts, paid acquisition tests |
| 4 — Product | depends | — | Estimator, case-study library, group network, automation |

The through-line: **nothing in Phase 1 costs money, and nothing in later phases
should be turned on before the phase before it has proven itself.** That's the
same logic as your fundraising strategy — organic proves it, low-cost
systematizes it, paid scales it.

---

## What I'd need from you to execute Phase 1

The account signups use your email/identity, so I can't create them for you.
The full credential list, in the order I'd use them:

1. **Database** — Supabase (or Neon) connection string.
2. **Hosting** — Netlify or Vercel account connected to the GitHub repo (or
   invite me as a collaborator).
3. **Cloudflare** — account with both domains added (I'll talk you through the
   nameserver switch), plus the two Turnstile keys it generates.
4. **Resend** — API key, after adding the domain it asks you to verify.
5. **Stripe** — the *secret key* from your existing account (Developers → API
   keys). The webhook key comes after the site is live (it needs the real
   address) — I'll tell you exactly where to click, ~10 minutes.

With those in hand: wiring and deploying is about an hour on my end, then the
30-entry verification pass in the admin panel is yours whenever you have an
afternoon. If you want the Store link hidden from the menu until Phase 3, say
so and I'll add that switch.
