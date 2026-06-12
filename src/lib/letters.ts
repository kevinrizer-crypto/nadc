/**
 * Editable letter templates for the write-your-officials tool. Drawn from
 * the playbook (content/pillars/how-to-fight-playbook.md) — each letter
 * anchors on written zoning/policy criteria rather than sentiment, per
 * Step 4: "Fight on the criteria, not the vibes."
 *
 * Placeholders in [BRACKETS] are filled by the user before sending.
 */
export const LETTER_TEMPLATES = [
  {
    id: "transparency",
    label: "Demand transparency (NDAs & disclosure)",
    subject: "Request for full disclosure on the proposed data center in [TOWN/COUNTY]",
    body: `Dear [TITLE LAST NAME],

I am a resident of [TOWN/COUNTY] writing about the data center project proposed at [LOCATION/PARCEL].

Before any approval moves forward, residents deserve answers on the record:

1. Who is the end user of this facility, and has any official or staff member signed a non-disclosure agreement related to it?
2. What are the project's projected peak power and water demands, and which studies support those figures?
3. What is the full incentive package — tax abatements, PILOT terms, and infrastructure commitments — and what is its total cost per permanent job?

Communities across the country have learned that projects negotiated in secrecy rarely serve residents' interests. I ask you to make all project documents public, hold a properly noticed public hearing, and decline to advance any application while material terms remain undisclosed.

Respectfully,
[YOUR NAME]
[YOUR ADDRESS]`,
  },
  {
    id: "criteria",
    label: "Oppose on zoning criteria",
    subject: "The proposed data center at [LOCATION] fails the county's own approval criteria",
    body: `Dear [TITLE LAST NAME],

I urge you to vote no on the rezoning/special-use application for the data center proposed at [LOCATION/PARCEL]. Your decision must be justified against the written standards in our comprehensive plan and zoning ordinance, and this application fails them:

1. Comprehensive plan consistency: the site is designated [RESIDENTIAL/AGRICULTURAL] in the comprehensive plan. A hyperscale industrial use is plainly inconsistent with that designation.
2. Infrastructure adequacy: the applicant has not provided verified peak-day water demand figures, drought provisions, or a binding commitment to fund the substations and transmission upgrades the project requires — costs that otherwise fall on every ratepayer.
3. Compatibility: 24/7 cooling equipment and routine diesel generator testing produce continuous industrial noise. Without enforceable nighttime decibel limits at the property line, setbacks, and berms, this use is incompatible with adjacent homes.

If the board nonetheless advances the project, any approval should be conditioned on enforceable development-agreement terms: a water-use cap, property-line noise limits measured at night, full disclosure of all phases and expansion rights, and infrastructure cost responsibility resting with the developer.

Respectfully,
[YOUR NAME]
[YOUR ADDRESS]`,
  },
  {
    id: "ratepayer",
    label: "State-level: protect ratepayers",
    subject: "Protect [STATE] ratepayers from data center infrastructure costs",
    body: `Dear [TITLE LAST NAME],

I am writing as a constituent concerned about the impact of large data center loads on household electric bills in [STATE].

Where regulators have not required large loads to pay their own way, the costs of new generation, transmission, and substations are spread across all ratepayers. In the PJM region, data center demand has been linked to an estimated $9.3 billion in added capacity costs — roughly $16–18 per month on typical residential bills in some states.

I ask you to support ratepayer-protection measures that require new large-load customers to:
1. Sign long-term contracts covering the full incremental cost of infrastructure built to serve them;
2. Bear the cost if a project is cancelled or scaled back after the utility builds for it; and
3. Disclose projected demand publicly before any incentive or interconnection approval.

A data center that pays its own way is a very different proposition from one that doesn't. Please make sure [STATE]'s rules can tell the difference.

Respectfully,
[YOUR NAME]
[YOUR ADDRESS]`,
  },
] as const;
