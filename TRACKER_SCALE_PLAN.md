# Tracker Scale Plan — from 78 to the hundreds, without verifying every row by hand

Companion to `TRACKER_EXPANSION_PLAN.md`, which settled the **licensing**
question (what we may reuse). This document settles the **scale** question:
how to get to hundreds or thousands of listings when nobody has time to
confirm each one personally.

---

## The constraint, stated honestly

We currently publish 78. There are plausibly thousands of US data centers
proposed, permitted, or under construction. The gap is not ambition — it is
that our existing pipeline assumes a human validates each entry, and that
does not scale past a few dozen per session.

The instinct is to relax standards to gain volume. That would be the wrong
trade for this project specifically: NADC's entire value is that a resident
can cite it at a county meeting without being embarrassed. One fabricated or
badly wrong listing costs more credibility than 500 correct ones earn.

## The principle that resolves it

**Replace per-row human review with source authority plus automated gates.**

A listing does not need a human to be trustworthy if:

1. It comes from a **primary public record** — the source *is* the evidence,
   not a claim about evidence.
2. We **repeat only what the record says**, and never upgrade it. If an
   interconnection queue says "large load, 300 MW, Loudoun County," we publish
   that — not "Amazon is building a data center."
3. Every listing **shows its provenance** and its tier, so a reader can judge
   it themselves and click through to the record.
4. **Automated gates** catch the failure modes a human would have caught.

This is how a newsroom handles public-records reporting at volume. The human
moves from *validating each row* to *designing and auditing the pipeline*.

## Mapping sources to the tiers we already have

The schema already has `verification_tier` = `verified | corroborated | lead`.
No migration needed — we just define which source classes land where.

| Tier | Meaning | Source classes | Published? |
|---|---|---|---|
| **verified** | Confirmed in a government primary record naming the facility | Air permits, incentive-recipient lists, county approvals, our own hand-verified seed | Yes |
| **corroborated** | Two or more independent non-primary sources agree | Epoch AI + news, queue entry + news, two outlets | Yes, labeled |
| **lead** | One non-primary source, or a record that implies but does not name a data center | Bare interconnection-queue entries, single news story, tips | **Admin-only** until promoted |

The important move: a bare interconnection-queue entry is a **lead**, not a
verified project, because the queue does not say "data center." That single
rule is what keeps volume from eroding trust.

## Sources, ranked by yield per unit of effort

### 1. State air-permit databases — highest credibility, high volume
Data centers need permits for backup generators. A site applying for twenty-plus
diesel gensets is, in practice, always a data center. These are **legal public
records**, searchable per state, with applicant, location, and capacity.

- Tier: **verified** when the permit names the facility type; **corroborated**
  otherwise.
- Effort: one adapter per state. Start with the states that carry the most
  activity — Virginia, Texas, Georgia, Ohio, Arizona, Illinois.
- Caveat: every state's system is different; some have APIs, some only
  searchable web forms. Formats need confirming per state during build.

### 2. ISO/RTO large-load interconnection queues — earliest signal, high volume
Data centers must request grid interconnection years before breaking ground.
PJM, ERCOT, MISO, SPP, CAISO, NYISO and ISO-NE publish queues covering most of
the country. This is the **leading indicator** — projects appear here before
any local news exists, which is exactly where NADC can beat everyone.

- Tier: **lead** on its own (requesters are usually shell LLCs and the load
  type is often unlabeled); promotes to **corroborated** when a permit, news
  story, or tip matches it.
- Effort: one adapter per ISO; formats are typically published spreadsheets.
- This is the single biggest volume unlock, *and* the one most likely to
  mislead if published unqualified. Hold these as leads.

### 3. State data-center tax-incentive recipient lists — small, near-perfect
Several states publish who received a data-center-specific sales-tax exemption
or abatement. If a state names a company as a data center incentive recipient,
that is authoritative and unambiguous.

- Tier: **verified**.
- Effort: low. Volume: modest but very clean.

### 4. Epoch AI — already wired, just re-run
`scripts/import-epoch.ts` exists, is idempotent, and is CC-BY. Schedule it
monthly rather than running it by hand.

### 5. Local news monitoring — the promotion engine
This is the fourth item on your list, and it is not a separate project: the
news pipeline is what **promotes leads to corroborated**. A queue entry in
Loudoun County plus a Loudoun Times story about a rezoning is a corroborated
project. Build them to feed each other.

## What replaces the human: automated gates

Every ingested row must pass all of these or it is held for review:

1. **Geocode sanity** — the address resolves, and the resolved state matches
   the claimed state. (Caught the Vantage TX1 AZ-vs-TX error.)
2. **Source liveness** — every citation URL returns 200 at import time. Dead
   link, no publish.
3. **Field plausibility** — MW capacity, acreage, and dates inside sane ranges;
   outliers held rather than published.
4. **No-upgrade check** — the listing's claims are a subset of what the source
   states. Enforced by keeping the raw source excerpt on the row.
5. **Duplicate clustering** — see below.
6. **Re-validation on a schedule** — sources re-checked periodically; a listing
   whose source has gone dead gets flagged, not silently kept.

## Deduplication: the part that actually bites

We already learned this the hard way. Fuzzy name-matching merged distinct
"Stargate" campuses in different counties into one entry and polluted its
sources. The fix then was to remove fuzzy merging entirely and insert by slug.

At scale, the same project *will* arrive from three sources under three names
("Project Sail," "Vantage TX1," "the Shackelford campus"). The approach:

- **Never auto-merge on name similarity.** Names are the least reliable field.
- **Cluster, don't merge.** Group candidates by state + county + geographic
  proximity + overlapping capacity, and surface the cluster in admin.
- **Auto-merge only on a hard identifier** — same permit number, same queue ID,
  same parcel. Those are facts, not guesses.
- Everything else waits for one human click.

This is the bounded human workload: not "verify 1,000 listings," but "resolve
maybe 30 ambiguous clusters a month," which is an evening's work.

## Phasing

| Phase | Work | Realistic yield |
|---|---|---|
| **1** | Schedule Epoch monthly; build the news monitor (item 3) | Keeps current data fresh |
| **2** | Incentive-recipient lists for the top states | Modest, all `verified` |
| **3** | Air permits, 5–6 highest-activity states | The main `verified` volume |
| **4** | ISO queues, starting with PJM and ERCOT | The main `lead` volume — big numbers, held back |
| **5** | Promotion engine: match leads against news + permits | Converts leads to published |

Volume figures are deliberately omitted. I can tell you the *shape* — permits
and queues are the large sources — but I have not yet pulled these datasets,
and inventing a row count for a plan document would be the same failure mode
the tiering exists to prevent. Phase 2 should begin with a counting pass.

## Public honesty

Two things to add to the tracker UI as volume grows:

- A **methodology page** explaining the tiers, the sources, and the gates in
  plain language, linked from every listing.
- A **corrections path** on each listing ("something wrong here?"), which is
  both good practice and the cheapest source of high-quality fixes.

At scale, the defensible claim is not "every entry was personally checked."
It is: **"every entry states only what a named public record says, links to
that record, and shows how confident we are."** That is stronger, because it
is auditable by anyone.

## Risks

- **Shell-company opacity.** Many filings use LLCs with no public parent. We
  should say "developer not disclosed in the filing" rather than guess.
- **State-by-state fragility.** Six permit adapters means six things that break
  when a state redesigns its portal. Build them to fail loudly and skip, never
  to guess.
- **Volume changing the product.** A tracker with 1,000 entries needs different
  navigation than one with 78 — filtering by state and status becomes essential,
  and the map needs clustering.
- **Leads leaking into public view.** The single highest-consequence bug in this
  design. Publishing policy must stay deny-by-default, and it deserves a test.
