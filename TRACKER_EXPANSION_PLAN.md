# NADC Tracker Expansion Plan — toward the most complete, credible US list

*Goal: the most complete and up-to-date list of current, proposed, and
under-construction US data centers — without breaking the one rule that makes
NADC worth trusting: every claim sourced, nothing faked, nothing overclaimed.*

---

## The core tension (and how we resolve it)

"Most complete" and "every entry verified by a human" pull in opposite
directions. The whole-internet list runs to **1,400–4,700+ facilities**
depending on the source; nobody can hand-check that, and the seed list of 30
was deliberately a small, hand-verified set of *contested* fights.

We resolve it the way credible research orgs do — **not** by pretending
everything is verified, but by **labeling every entry with how solid it is**,
and only ever claiming "verified" for what truly is. The site is already built
for this: project pages already show a "Last verified [date]" stamp or an
"Unverified — preliminary" banner. We extend that into three clear tiers:

| Tier | What it means | How it's shown |
|---|---|---|
| **Verified** | A human or a strong primary source (county filing, utility docket, local news) confirmed it. | Green "Verified [date]" + sources |
| **Corroborated** | Appears in 2+ independent reputable datasets, auto-enriched (geocoded, county matched). Not yet human-checked. | Amber "Reported — help us verify" + sources + a one-click "confirm/correct" prompt |
| **Lead** | Single secondary source. | Kept unpublished in admin for review (not public), OR published only if you choose, clearly marked "Unverified" |

This is the honest version of "go broad": we never call something verified that
isn't, and the breadth becomes an asset instead of a liability.

**Two automated verification methods do the heavy lifting (no humans required):**
1. **Cross-source agreement.** If the same facility shows up in two or more
   independent reputable datasets, that agreement *is* a verification signal —
   it auto-promotes the entry to "Corroborated."
2. **Community verification — the NADC-native method.** Publishing
   "Corroborated" entries with a "See an error? Tell us / Confirm this project"
   prompt turns your audience into the human-verification layer. The person who
   lives next to the site is a better fact-checker than any staffer, and the tip
   pipeline already exists to capture their corrections. Breadth actually *feeds*
   the growth loop instead of competing with it.

A bonus that makes this worth the effort: per the original brief, a page per
project is the **#1 organic-acquisition engine** ("stop data center [town]").
Going from 30 to hundreds of honestly-labeled project pages is the single
biggest SEO expansion available to us — as long as each page is genuinely useful
and never overclaims.

---

## What's actually out there (source assessment)

The licensing differences matter more than the row counts — NADC takes
donations and runs a store, so "non-commercial only" data is off-limits without
permission.

| Source | Size | License / terms | Verdict |
|---|---|---|---|
| **Epoch AI — Frontier Data Centers** | ~dozens (the biggest AI campuses) | **CC-BY 4.0** — free to reproduce *commercially* with credit. Satellite-verified. CSV download. | ✅ **Use directly now.** Cleanest license, highest quality, just credit "Epoch AI." Narrow but high-value. |
| **FracTracker — US Data Centers Tracker** | 1,400+ sites (803 pre-dev/construction) | Open-access but **non-commercial only**. Advocacy org; *invites* collaboration & submissions. | ⚠️ **Partner, don't scrape.** A monetized site can't ingest their non-commercial data unethically. But they're a mission ally — reach out (jones@fractracker.org) for a data-sharing arrangement. Best long-term source. |
| **IM3 Open Data Center Atlas** (DOE/OSTI, OpenStreetMap-derived) | facility locations nationwide | Open (OSM/ODbL — **share-alike** + attribution) | ❌ **Decision: do not import.** ODbL's share-alike clause could obligate releasing NADC's whole curated database under ODbL. Facts-only cross-checking is fine; bulk import is not worth the legal entanglement. |
| **DataCenterWatch** | contested projects | Already cited by your seed; opposition-focused | ✅ **Most mission-relevant.** Confirm reuse terms; ideal cross-reference for the "fights." |
| **trackdatacenters.com** ("Proposal Tracker") | proposals | Unknown (blocked our read) | 🔎 Worth a manual look — proposals are exactly our lane. |
| **Cleanview / usdatamap.com / dcmap.us** | 800–4,700 | Commercial products, restrictive/unclear terms, paid/beta APIs | ⚠️ **Leads only.** Use to *find* projects, then verify & cite the primary source — never bulk-copy. |

The principle underneath all of this: **facts aren't copyrightable, but
databases and licenses are.** We can state "a data center is proposed at X by Y"
and cite where we confirmed it — that's journalism. We can't lift someone's
curated dataset wholesale. So the commercial aggregators become *lead lists*
that point us to primary sources we cite ourselves.

---

## The plan, in phases

> **Status (June 12, 2026):** Phases A and B are **live in production**.
> The tracker now carries **70 published projects**: 30 hand-verified seed
> entries + 40 "Corroborated" facilities imported from Epoch AI (CC-BY 4.0,
> attributed on every entry), with 3 seed entries enriched by Epoch sources
> (Stargate Abilene, xAI Colossus ×2). 9 Epoch rows with no usable address are
> held out for manual placement (list below). Publishing policy: Conservative
> (Verified + Corroborated public; Leads admin-only), per Kevin's call.
> Importer: `scripts/import-epoch.ts` (dry-run by default, `--apply` to write;
> re-run monthly to stay current).
>
> **Held-out Epoch rows (no address in source — place manually):**
> Amazon Madison Mega Site (MS), Amazon Ridgeland (MS — address parses now,
> re-run picks it up), Google Storey County (NV), Google Mesa (AZ), Google
> Papillion (NE), Stream Phoenix (AZ), Vantage TX1 (AZ), OpenAI Stargate
> Shackelford / New Mexico / Wisconsin / Michigan / Milam, Google Kansas City
> East. These are exactly Tier-3 leads: confirm a parcel/county from local
> coverage, then add via admin.

**Phase A — Make the tracker able to tell the truth at scale (prerequisite). ✅ DONE**
Add the 3-tier trust model: a "verification tier" on each project, tier-aware
labels/filters on the map and table, and the "confirm/correct this entry"
prompt that routes into the existing tip queue. ~Half a day of build. Nothing
imports until this exists, so we never publish an unlabeled claim.

**Phase B — Import the clean, licensed data (safe, immediate). ✅ DONE (Epoch; OSM dropped on licensing grounds)**
A repeatable importer script that pulls **Epoch AI** (CC-BY) and the **OSM/IM3**
locations, normalizes them to our schema, **geocodes & dedupes against the
existing 30**, attaches attribution, and loads them at the right tier. Re-runnable
monthly so the list stays current. This alone meaningfully expands coverage with
zero licensing risk.

**Phase C — Lead-driven primary-source verification (the smart, scalable part).**
For candidate projects gathered from the aggregator *leads*, an automated
pipeline does a targeted web search + structured read to find and attach a
primary or local-news source confirming each one. Projects that get a
corroborating source → "Corroborated," published. Projects that don't → held as
"Lead" for human review. This is "fact-check at scale": humans only look at the
ambiguous minority, not all 1,000+.

**Phase D — Partnerships & the community flywheel.**
Reach out to FracTracker and DataCenterWatch for proper data-sharing (mission
allies, far better than scraping). Meanwhile every published "Corroborated"
entry is quietly recruiting its own neighbors to verify it via the tip line.
Over weeks, the crowd upgrades entries from Corroborated → Verified for free.

---

## Decisions I need from you

1. **How aggressive on publishing unverified tiers?** Three options:
   - *Conservative:* only "Verified" + "Corroborated (2+ sources)" go public;
     single-source leads stay in admin. (Safest for credibility.)
   - *Balanced:* also publish single-source "Leads" but clearly marked
     "Unverified," to maximize SEO/coverage and let the crowd correct them.
   - *Your call per source* — e.g., publish Epoch broadly, hold aggregator leads.
   My recommendation: **Conservative to launch, loosen once the labeling and
   community-correction loop prove themselves.**

2. **Pursue the FracTracker / DataCenterWatch partnerships?** (I can draft the
   outreach emails — it's the highest-value, lowest-risk path to 1,400+ sites.)

3. **Any budget for a paid data API** (e.g., Cleanview) if the free/open +
   partnership routes leave gaps? Default assumption: **no — free/open only**,
   consistent with everything so far.

---

## What I'd do first (pending your nod on #1)

Start with **Phase A + the Epoch AI import** — it's unambiguously safe (CC-BY),
proves the tier system end-to-end on the live site, and immediately adds the
marquee AI campuses (Stargate, Meta Hyperion, the xAI/Memphis cluster, etc.)
with satellite-grade sourcing. From there we layer in OSM locations and the
lead-verification pipeline. I won't publish anything beyond the current 30 until
you've okayed the tier model and how aggressive to be.
