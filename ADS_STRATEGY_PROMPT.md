# Ads Strategy — New-Thread Prompt + Reddit Runbook

Two things here:
1. **A self-contained prompt** to paste into a fresh chat thread to develop the
   full creative + campaign strategy (copy, audiences, A/B matrix, budget pacing).
2. **A click-by-click Reddit setup runbook** for you to execute with Reddit open.

---

## 1. Prompt to paste into a new thread

> You are a senior growth-marketing strategist for **Neighbors Against Data
> Centers (NADC)**, a nonpartisan, fact-checked watchdog and organizing hub at
> **nadc.info**. Mission: turn alarmed residents into organized opposition to
> harmful data center projects. Brand voice: plainspoken, credible, resolute,
> evidence-first, never hysterical or conspiratorial; pro-transparency, not
> anti-technology. Tagline: "Big Tech has lobbyists. You have neighbors."
>
> **Develop a complete paid-ads creative and campaign strategy.** Context you
> need:
>
> - **Funnel (two-step, non-negotiable):** cold ads optimize for a *confirmed
>   email subscriber*, not a donation. Donations come from email nurture (a
>   weekly newsletter, "The Grid") and from retargeting warm visitors. The
>   recurring "$10–25/month Neighbor" membership is the revenue engine.
> - **Economics:** a $15/mo Neighbor ≈ $270 lifetime. Target cost-per-confirmed-
>   email under $3–4 (push toward $2); blended cost-per-Neighbor under ~$130.
> - **Channels, in priority order:** Reddit first ($50/day to start), then Google
>   Search (highest intent: "stop data center [town]"), then Meta (FB/IG +
>   lookalikes from the email list + retargeting), then Nextdoor for hot local
>   fights.
> - **Audiences/geos:** alarmed homeowners (35–65), emerging local organizers,
>   and local officials. Hotspot metros: Northern Virginia, Atlanta/GA, Texas,
>   Arizona, Ohio, Memphis/TN, Pennsylvania, Indiana, Wisconsin.
> - **Proof points to build creative on (all sourced on the site):** US
>   residential electricity prices rose ~7% in 2025 with data centers driving
>   ~40% of demand growth; a single hyperscale campus uses 1–5 million gallons of
>   water/day; communities blocked or stalled 48+ data center projects worth
>   $156B in 2025; counties often sign NDAs hiding project details; jobs/tax-
>   revenue claims are routinely overstated.
> - **Landing pages available:** the interactive tracker ("is a data center
>   proposed near you?"), six sourced pillar articles (electricity rates, water,
>   property values, jobs/incentives, NDAs, the how-to-fight playbook), per-
>   project pages, a free [TOWN] yard-sign maker, the donate page, and email
>   capture on every page. All links can carry UTM tags.
> - **Compliance reality:** these ads will likely be classified as "social
>   issue / political" on Meta and Google, requiring advertiser verification and
>   "paid for by" disclaimers — factor in lead time and disclaimer-safe copy.
>
> **Deliver:**
> 1. **Messaging architecture** — 4–6 distinct angles (e.g. the bill, water,
>    property values, secrecy/NDA, empowerment/"you can win," local/"near you"),
>    each with the emotional driver, the proof point, and the matched landing page.
> 2. **Ad copy** — for Reddit specifically, 3 variations per angle in Reddit-
>    native voice (headline + body that reads like a knowledgeable neighbor's
>    post, not a billboard), each with a clear CTA and the UTM-tagged
>    destination. Then adapt the top angles for Google Search (responsive search
>    ad headlines/descriptions + keyword lists) and Meta (primary text + headline
>    + creative direction).
> 3. **Audience/targeting matrix** per platform — for Reddit: specific
>    subreddits, interests, keywords, and geos; for Google: keyword lists with
>    match types and negatives; for Meta: interests, behaviors, lookalike and
>    retargeting setups.
> 4. **A/B test plan** — what to test first, in what order, success metrics, and
>    statistical-significance thresholds at $50/day.
> 5. **Budget pacing & scaling rules** — how to allocate $50/day across
>    campaigns/ad groups, kill/scale triggers, and a 30/60/90 ramp.
> 6. **Creative-asset shot list** — the specific images/graphics to produce
>    (the org has a shield logo, brand palette of navy #00469C / red #CC1332 /
>    charcoal #3F403A, and yard-sign artwork), with text-overlay suggestions.
>
> Keep every claim accurate and sourced — credibility is the organization's
> entire asset. Produce it as a structured plan I can execute directly.

*(The repo's `PAID_ADS_PLAN.md` has the funnel, CPA math, and scaling rules in
more depth if the new thread wants the full context — paste relevant sections in.)*

---

## 2. Reddit setup runbook (do this with Reddit Ads open)

> I can't operate your live, money-spending ad account for you (billing and the
> launch button should be your hands). Here's the exact sequence — it takes
> ~30–45 min, most of it the one-time pixel + verification.

### A. Account + conversion tracking (do this before spending)
1. Create an account at **ads.reddit.com** → add billing.
2. Complete **advocacy/issue-ad verification** if prompted (Reddit reviews
   advocacy creative; usually fast, but start now).
3. Go to **Events Manager → create a Pixel**. Copy the **Pixel/Advertiser ID**
   (looks like `a2_xxxxxxxx`).
4. **Send me that ID** (or add it yourself in Vercel → Environment Variables as
   `NEXT_PUBLIC_REDDIT_PIXEL_ID`, then redeploy). The site is already wired to
   fire **PageVisit**, **SignUp** (on confirmed email), and **Purchase** (on
   donation) — they'll start reporting the moment the ID is live.

### B. Campaign (mirrors PAID_ADS_PLAN.md §5)
5. **Create campaign.** Objective: **Traffic** for the first 3–5 days (to seed
   the pixel and learn CTR), then duplicate it as **Conversions → SignUp** once
   the pixel has data.
6. **Create 3 ad groups**, ~$15/day each (Reddit min is $5/group/day):
   - **A — Geo hotspots:** location-target VA, GA, TX, AZ, OH, TN, PA, IN, WI;
     add interest "data centers / local politics."
   - **B — Subreddits:** add r/nova, r/Georgia, r/ohio, r/wisconsin, r/Arizona,
     relevant city subs, + r/energy, r/environment, r/RealEstate.
   - **C — Keywords:** "data center," "rezoning," "electric bill," "property
     values," "moratorium."
7. **Create 3 ads per group** from the angles in the strategy output. Use
   **UTM-tagged destination URLs** so the admin Attribution report can track
   them, e.g.:
   `https://nadc.info/learn/electricity-rates?utm_source=reddit&utm_medium=cpc&utm_campaign=bill_angle&utm_content=creative_a`
   - Vary `utm_campaign` per angle and `utm_content` per creative.
   - Good starting destinations: the matching pillar article, the tracker, or
     the free yard-sign maker.
8. Set the **daily cap to $50**, launch, and let it run **2 weeks** before hard
   judgments.

### C. Read the results
9. In Reddit Ads Manager: watch CTR, CPC, and (once on the Conversions
   objective) cost-per-SignUp.
10. In **nadc.info/admin/attribution**: see confirmed emails and donors by
    `utm_source`/`utm_campaign`. Divide your Reddit spend by these for true
    cost-per-email and cost-per-donor — the numbers that drive every kill/scale
    decision.

### What I'll do once you send the Pixel ID
- Confirm the pixel fires correctly on PageVisit / SignUp / Purchase.
- Help interpret the attribution report and tune the kill/scale thresholds.
- Build angle-specific landing variants or Google/Meta pixels when you add those
  channels.
