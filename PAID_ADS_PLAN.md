# NADC Paid Acquisition Plan — Reddit-first, $50/day → scale

*Companion to NADC_Launch_Marketing_Fundraising_Strategy.md. That doc's
sequence is organic → low-cost → paid; this is the paid playbook. Start small,
measure honestly, scale only what proves out.*

---

## 1. What we're actually optimizing for (read this first)

**Cold traffic does not donate.** A stranger who's never heard of NADC will not
hand you $15/month on the first click. So we do **not** optimize ads for
donations directly. We run a two-step funnel:

```
Ad → high-intent landing (tracker / pillar) → EMAIL CAPTURE → nurture (The Grid) → Neighbor donor
                                            ↘ tip / petition (engagement)
        warm visitors + email list → RETARGETING → donation
```

- **Primary conversion event for cold ads: a confirmed email subscriber.** It's
  cheap, high-intent, and it's an asset you own. This is the number we drive down.
- **Donations come from the nurtured list and from retargeting warm traffic** —
  not from cold prospecting. This matches the strategy doc: the recurring
  "Neighbor" base is built from engaged subscribers, not impulse clicks.

Everything below serves that funnel.

---

## 2. The math that governs every decision (CPA ceilings)

A monthly "Neighbor" at $15/mo, assuming a conservative 18-month average
retention ≈ **$270 lifetime** (~$262 net of Stripe fees), plus one-time gifts
and store margin on top.

| Email→Neighbor conversion | Expected donor value per email |
|---|---|
| 1% | ~$2.60 |
| 2% | ~$5.20 |
| 3% | ~$7.90 |

**Starting CPA ceilings (validate, then tighten):**
- **Cost per confirmed email subscriber: target < $3–4** to start; push toward
  **< $2** as creative/targeting dial in. Below ~$2 the funnel is clearly
  profitable even at a pessimistic 1% donor-conversion.
- **Blended cost per recurring Neighbor: keep < ~$130** (≈ half of LTV) to stay
  in credibility-safe fundraising-efficiency territory (strategy doc guardrail).
- Cold **direct-donation** CPA will look terrible — ignore it. Judge donation
  ads only on **retargeting** audiences.

These ceilings are the kill/scale triggers. Everything is measured against them.

---

## 3. Measurement first — the prerequisite (we can't "dial in" what we can't see)

Before a dollar is spent, attribution has to be wired, or you're flying blind.
**This is the part NADC can build (and most orgs never do well):**

1. **Reddit Pixel** on the site, firing two conversion events:
   - `SignUp` — when an email subscriber **confirms** (double opt-in complete).
   - `Purchase` (value = amount) — when a donation completes.
2. **UTM capture into the database.** Because we own the DB, we can stamp
   `utm_source / medium / campaign / content` onto each **subscriber** and
   **donation** row. That closes the loop most nonprofits can't: true
   **cost-per-email and cost-per-donor by campaign**, visible in `/admin`.
3. A small **admin attribution view**: spend (entered manually or via Reddit
   export) vs. emails vs. donors vs. recurring run-rate, per campaign.

→ *This is the highest-value thing to build next. Without it, scaling decisions
are guesses. (See §11 — offer to build.)*

Also set up free analytics: **Cloudflare Web Analytics** (privacy-friendly, no
cookie banner) for top-of-funnel traffic.

---

## 4. Why Reddit is a smart first paid channel

- **Hyper-specific targeting** by subreddit, interest, keyword, **and geography**
  — we can hit exactly the metros with active fights.
- **The audience is already there.** Local and state subreddits routinely have
  threads about proposed data centers, rezonings, and electric bills.
- **Reddit rewards native, factual, non-salesy creative** — which is precisely
  NADC's brand. Our sourced stats read as "did you know," not as ads.
- Generally **lower CPMs** than Meta/Google in these niches.

---

## 5. Reddit campaign structure for $50/day

**Don't spread $50 thin.** One campaign, ~3 ad groups, ~3 creatives each. Run
**≥ 2 weeks** before hard judgments (learning + significance at this budget).

**Objective:** start on **Traffic** for 3–5 days to seed the pixel and learn
CTR, then switch to **Conversions (optimize for SignUp)** once the pixel has
data.

**Ad groups (~$15/day each; Reddit min is $5/group/day):**

| Ad group | Targeting | Landing page |
|---|---|---|
| **A — Geo hotspots** | US, narrowed to high-activity states/metros: N. Virginia, Atlanta/GA, TX, AZ, OH, Memphis/TN, PA, IN, WI. + interest "data centers / local politics." | Tracker (state-filtered) or the relevant pillar |
| **B — Subreddit** | Local/state subs (r/nova, r/Georgia, r/ohio, r/wisconsin, r/Arizona, city subs) + topical (r/energy, r/environment, r/RealEstate). | Pillar article matching the angle |
| **C — Keyword/contextual** | Reddit keyword targeting: "data center," "rezoning," "electric bill," "property values," "moratorium." | Tracker search ("is one proposed near you?") |

**Creative angles to test (each links to its sourced page):**

1. **The bill** — "Your electric bill is quietly subsidizing a data center. Here's the receipt." → *electricity-rates* pillar.
2. **Empowerment** — "Communities blocked 48 data centers worth $156B last year. Here's the playbook." → *how-to-fight* playbook.
3. **Local/tracker** — "Is a data center proposed near you? Search the national tracker." → tracker.
4. **Secrecy** — "Your county may have signed an NDA about the data center next door." → *NDAs* pillar.
5. (Bench) **Water / property values** angles to rotate in.

Every landing page already has visible email capture and a tracker link — that's
the conversion mechanism. Tag every URL with UTMs.

---

## 6. Benchmarks & weekly optimization rules

*Starting assumptions to validate — Reddit display: CTR ~0.2–0.6%, CPC ~$0.30–
$1.50, CPM ~$3–8.*

- **Kill a creative** with CTR < ~0.2% after ~1,000 impressions.
- **Kill an ad group** with cost-per-email > 2× ceiling after ~$100–150 spend.
- **Scale a winner** +20–30% every 3–4 days (don't double overnight — it resets
  Reddit's learning).
- **Refresh creative every 2–3 weeks** — Reddit fatigues fast.
- Watch **landing-page → email conversion** separately from ad CTR; a great CTR
  with poor signup means the landing page (not the ad) is the problem.

---

## 7. Scaling rules

When **cost-per-email holds below ceiling for 7 straight days** at the current
budget, step up: **$50 → $75 → $100 → $150/day**, raising ~30% at a time and
holding 3–4 days between steps. If CPA creeps above ceiling as you scale, you've
found the channel's efficient ceiling — hold there and **add a platform** rather
than forcing more spend into diminishing returns.

Tie spend to the recurring base it creates (strategy doc reinvestment policy):
early on you can reinvest aggressively, but as the house file grows, taper toward
**15–20% of revenue** to keep mission funding at 80%+.

---

## 8. Multi-platform roadmap (add in this order)

1. **Google Search — strongest #2, consider running in parallel now.** People
   search **"stop data center [town]," "[town] data center," "[state] data
   center moratorium"** *at the moment of alarm* — the highest intent that
   exists, and the brief's exact target keywords. Small budget, exact/phrase
   match, location-targeted. Often the best ROAS of any channel here.
2. **Meta (Facebook + Instagram).** Detailed geo + homeowner/interest targeting,
   **lookalikes from your email list**, and retargeting. Facebook Groups are
   where these fights already organize — strong fit for the "alarmed homeowner"
   (35–65, homeowner) persona.
3. **Nextdoor.** Hyperlocal, exactly the audience (homeowners by neighborhood).
   Clunkier tooling / higher minimums — deploy for specific hot fights.
4. **Later:** a YouTube/short-form explainer; programmatic on local-news sites in
   hotspot metros.

---

## 9. Guardrails (non-negotiable)

- **⚠️ Issue/political-ad classification.** Ads opposing data centers and
  mentioning officials/legislation will likely be flagged as **"social issue /
  political" ads** on **Meta and Google** — which require **advertiser identity
  verification + "paid for by" disclaimers** before they'll run, and on Reddit
  trigger advocacy-ad review. **Budget 1–2 weeks of lead time** for verification
  on each platform so launch isn't blocked. (Reddit is usually the fastest to
  approve advocacy creative; this is another reason to start there.)
- **Every ad is accurate and sourced.** No fear-mongering, no unsourced stat,
  non-partisan tone. Credibility is the entire asset — a viral-but-sloppy ad that
  gets fact-checked costs more than it earns. Link only to sourced pages.
- **Protect the mission ratio.** Don't let CPA creep erode the 65¢+/dollar-to-
  mission commitment. The CPA ceilings in §2 enforce this.

---

## 10. 30 / 60 / 90

- **Days 0–7:** wire measurement (pixel + UTM attribution + analytics); set up
  Reddit account + issue-ad verification; build campaign A/B/C with 3 creatives
  each; launch on Traffic objective.
- **Days 8–30:** switch to Conversions(SignUp); weekly kill/scale passes;
  establish real cost-per-email; refresh creative once. Stand up Google Search in
  parallel (low budget) — its intent is too good to wait on.
- **Days 31–60:** scale the winning Reddit ad groups; begin Meta verification;
  build a retargeting audience (site visitors + email list) and test
  **donation** ads to *warm* audiences only.
- **Days 61–90:** add Meta (prospecting + lookalike + retargeting); report
  blended cost-per-email and cost-per-Neighbor; set the steady-state budget by
  channel against proven CPA.

---

## 11. What's needed — yours vs. mine

**You set up (accounts/creative/billing):**
- Reddit Ads account + billing; complete advocacy/issue-ad verification.
- (Parallel) Google Ads + Meta Business accounts; start their issue-ad
  verification early.
- Creative production: I can draft all ad copy from the pillars; you'll want
  1–2 simple images per angle (the brand assets + a stat overlay work well).

**I can build (the measurement layer — the prerequisite for everything):**
- Reddit Pixel + `SignUp`/`Purchase` conversion events.
- **UTM attribution** stamped onto subscriber + donation records.
- An `/admin` attribution view: spend vs. emails vs. donors vs. run-rate by campaign.
- Cloudflare Web Analytics snippet.
- A/B-ready landing variants if we want angle-specific pages.

**Recommended first step:** build the measurement layer, *then* spend. Want me
to start on the pixel + UTM attribution?
