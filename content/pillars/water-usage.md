# How Much Water Does a Data Center Use?

**Meta description:** Data center water use ranges from near-zero to millions of gallons a day depending on cooling design. Here are the real numbers, the hidden indirect water footprint, and the exact disclosure questions to ask before your town approves a project.

**Key takeaways**
- Direct water use varies enormously by cooling design: large hyperscale facilities using evaporative cooling can consume **1–5 million gallons per day** — at the top end, as much as a town of 10,000–50,000 people. Closed-loop and air-cooled designs use a small fraction of that.
- Most of the water "consumed" is evaporated and not returned to the local water system. Google reported withdrawing 7.8 billion gallons across its data centers in 2024 and consuming 78% of it; its largest facility (Council Bluffs, Iowa) consumed an average of 2.8 million gallons *per day*.
- There is a major transparency gap: fewer than one-third of operators have historically tracked or disclosed water consumption, and usage often spikes in summer — exactly when local supplies are tightest.
- The water-vs-power tradeoff is real: designs that use less water typically use more electricity (and vice versa). The right question isn't "does it use water?" but "**which design, from which source, with what enforceable caps?**"

---

## The honest range

Reported and estimated figures, low to high:

- **Air-cooled / closed-loop / immersion-cooled facilities:** minimal ongoing water use — some need little more than an office building.
- **Medium-sized data centers** with conventional cooling: on the order of 110 million gallons per year (~300,000 gal/day) — roughly the usage of 1,000 households.
- **Hyperscale facilities with evaporative cooling:** commonly 1–5 million gallons per day, with demand that can roughly triple in hot weather.
- **Company disclosures:** Of 24 Google data centers in the U.S. and Canada reporting 2024 figures, nine withdrew under 500,000 gal/day, while three withdrew over 2 million gal/day. Google's total water consumption rose from 4.3 billion gallons in 2021 to 6.1 billion in 2024.

At the national level, U.S. data centers were estimated to consume roughly 449 million gallons per day as of 2021 — before the AI buildout accelerated. A 2026 academic analysis estimates U.S. data centers could require **697–1,451 million gallons per day of *new* water capacity by 2030** — at the high end, more than New York City's entire daily supply (~1,000 MGD). State-level studies show the same trajectory: research by the Houston Advanced Research Center and University of Houston projects Texas data centers will grow from 49 billion gallons in 2025 to as much as 399 billion gallons in 2030.

## The footprint nobody mentions: indirect water

Generating electricity consumes water too — thermoelectric power plants evaporate large volumes for cooling. Because data centers are massive electricity consumers, their *indirect* water footprint through the power grid can rival or exceed direct cooling use. Estimates vary widely (federal lab figures and independent analyses differ by 2–3x), so NADC presents this as a range rather than a single number — but any honest accounting of a project's water impact must include the water used to generate its power. A facility marketed as "waterless" that runs on water-cooled gas generation has simply moved its water use out of view.

## The strongest case on the other side — taken seriously

1. **Context matters.** Agriculture dwarfs data centers in most regions (86% of water use in Arizona, for example). Golf courses nationally use roughly 2 billion gallons daily. A single data center is rarely the largest water user in a watershed.
2. **The industry is improving.** Closed-loop, immersion, and dry-cooling designs are spreading, and several hyperscalers have replenishment commitments. Renewable-powered facilities also slash *indirect* water use, since solar and wind generation consume almost no water.
3. **Per-query framing can mislead.** Viral "a bottle of water per AI prompt" statistics rest on contested assumptions and shouldn't anchor a serious local analysis.

All true. But none of it answers the question that matters locally: **what will *this* facility draw, from *which* source, in *your* watershed, in August?** A "small share of national water use" can still strain a single municipal utility, a stressed aquifer, or a drought-prone basin — Google itself reported that 31% of its freshwater withdrawals came from watersheds with medium or high water scarcity. And nearly two-thirds of the U.S. experienced drought conditions in 2025 while AI data centers consumed an estimated 550 million gallons daily.

## The disclosure questions that decide everything

Before any approval, your officials should require — in writing, as enforceable conditions:

1. **Cooling design**, specified in the permit (evaporative, closed-loop, air, hybrid), with any future change requiring new approval.
2. **Maximum daily withdrawal and consumption**, including peak summer days — not annual averages, which hide spikes.
3. **Water source** (municipal potable, groundwater wells, reclaimed/gray water) and whether residential users have priority in shortage conditions.
4. **Drought triggers:** what curtailment the facility accepts when conservation orders hit households.
5. **Metering and public reporting**, at least quarterly. If fewer than a third of operators track water use voluntarily, the permit has to make it mandatory.

Pima County, Arizona offers a working model: after a data center controversy, it adopted rules ensuring that a proposed facility's projected power and water use cannot be shielded from the public by nondisclosure agreements.

---

## FAQ

**How much water does a data center use per day?**
Anywhere from almost none (air-cooled/closed-loop designs) to 1–5 million gallons per day for large evaporatively cooled hyperscale facilities. Always ask for the specific design and peak-day figures for the proposed project.

**Does the water come back?**
Mostly no, for evaporative systems. Google reported consuming (evaporating) 78% of the 7.8 billion gallons it withdrew in 2024.

**Is a data center worse than a golf course?**
At the high end, far worse — a 5 million gal/day facility uses many times a typical course's irrigation. At the low end, a closed-loop facility uses less than either. Design determines everything.

**Can a town require water limits?**
Yes — through permit conditions, development agreements, and ordinances. Enforceable caps, drought curtailment, and public metering are all in use today.

---

## Sources
- EESI, "Data Centers and Water Consumption": https://www.eesi.org/articles/view/data-centers-and-water-consumption
- MOST Policy Initiative, "Data Center Water Use" (Apr 2026, incl. Google/Equinix disclosures): https://mostpolicyinitiative.org/science-note/data-center-water-use/
- Nature Forward, "Data Centers and Water Use" (Mar 2026): https://natureforward.org/data-centers-and-water-use/
- Lawrence Berkeley National Laboratory, Center of Expertise, "Water Efficiency": https://datacenters.lbl.gov/water-efficiency
- Lincoln Institute of Land Policy, "Data Drain: The Land and Water Impacts of the AI Boom" (Feb 2026): https://www.lincolninst.edu/publications/land-lines-magazine/articles/land-water-impacts-data-centers/
- "Small Bottle, Big Pipe" (arXiv, 2026 — projected new water capacity needs): https://arxiv.org/pdf/2603.02705
- Construction Physics, on indirect water estimate uncertainty (Sep 2025): https://www.construction-physics.com/p/i-was-wrong-about-data-center-water
- Barchart, AI data center water consumption amid 2025 drought: https://www.barchart.com/story/news/2339834/
- FWPCOA, "Myths vs. Reality: Data Centers and Water Usage" (industry-side context): https://www.fwpcoa.org/content.aspx?page_id=5&club_id=859275&item_id=130961
