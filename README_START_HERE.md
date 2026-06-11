# Neighbors Against Data Centers — Master Package

*Everything you need to rebuild the NADC site with Claude Fable 5, plus the supporting strategy and content. Last compiled June 11, 2026.*

---

## START HERE: How to use this package with Claude Fable 5

1. Open **`NADC_Fable5_Build_Prompt`** (.md, .docx, or .pdf — same content, pick your format) and paste its full text into Claude Fable 5.
2. Attach these supporting files in the same session so the model has the real content and data:
   - The **six pillar articles** (pillar-1 through pillar-6) — the fact-checked, sourced content for the Learn section.
   - **`NADC_tracker_seed_dataset.csv`** — the verified starting data for the tracker.
   - **`NADC_Freename_AI_Brief`** — brand, voice, positioning, and site architecture.
   - **`NADC_Launch_Marketing_Fundraising_Strategy`** — for the recurring-donation framing and transparency commitments.
   - Your **logo / brand assets** (not included here — add your own files).
3. The prompt instructs the model to stop and ask you for credentials (Stripe, email, SMS, etc.) rather than fake them. Have those accounts ready when you reach the "Go-Live Checklist" stage.

---

## What's in this package

### The build prompt (the main deliverable)
- `NADC_Fable5_Build_Prompt.md / .docx / .pdf` — the detailed instruction set for rebuilding the site as a real, working full-stack application with live data, tip intake, email/SMS subscriptions, donations, and a storefront.

### Tracker data
- `NADC_tracker_seed_dataset.csv` — ~30 verified proposed/contested/resolved data center projects with developer, location, county, nearest ZIP, coordinates, status, capacity, investment, notes, and source URLs. **Re-verify status before publishing** — several entries change month to month.

### Learn section content (six fact-checked pillar articles)
Each is provided in .md, .docx, and .pdf. Each includes a key-takeaways box, an FAQ block, and a full source list.
- `pillar-1-electricity-rates` — Do data centers raise electricity rates?
- `pillar-2-water-usage` — How much water does a data center use?
- `pillar-3-property-values` — Do data centers affect property values?
- `pillar-4-jobs-and-incentives` — How many jobs does a data center actually create?
- `pillar-5-ndas-and-secrecy` — What is a data center NDA?
- `pillar-6-how-to-fight-playbook` — How to fight a data center proposal (the playbook).

### Strategy & brand
- `NADC_Freename_AI_Brief` — mission, audience personas, brand voice, full site architecture, store SKUs, editorial principles. (Originally written for Freename; the brand/architecture sections apply to any build.)
- `NADC_Launch_Marketing_Fundraising_Strategy` — phased launch plan (organic → low-cost → paid), donation forecasting model, and reinvestment policy.

---

## A few things to keep in mind

- **Credibility is the whole asset.** The content is sourced and the prompt forbids the model from inventing data or citations. Keep it that way as you expand.
- **"Live" features need your accounts.** Donations (Stripe), email, and especially **SMS (requires 10DLC carrier registration + documented consent)** won't actually send/charge until you complete the external setup in the prompt's Go-Live Checklist.
- **Put the site behind Cloudflare.** Free tier covers SSL, DDoS protection, and CDN scaling — important for an org that may attract hostile traffic. Lock the registrar and turn on 2FA everywhere.
- **Domains:** nadc.info is canonical; redirect neighborsagainstdatacenters.com to it.
- **The tracker dataset is a seed, not the finished database.** The tip line plus admin curation is the mechanism that keeps it growing and current.
