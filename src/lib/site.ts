// Site-wide constants. nadc.info is canonical; the .com 301s to it.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nadc.info";
export const SITE_NAME = "Neighbors Against Data Centers";
export const SITE_TAGLINE = "Big Tech has lobbyists. You have neighbors.";
export const SITE_DESCRIPTION =
  "Neighbors Against Data Centers is a nationwide, fact-checked hub helping alarmed neighbors organize effective opposition to harmful data centers in their communities.";
export const OG_DESCRIPTION =
  "Nationwide, fact-checked hub turning alarmed neighbors into organized opposition to harmful data centers.";

export const NAV = [
  { label: "Learn", href: "/learn" },
  { label: "Tracker", href: "/tracker" },
  { label: "Organize", href: "/organize" },
  { label: "Act", href: "/act" },
  { label: "Store", href: "/store" },
  { label: "News", href: "/news" },
  { label: "About", href: "/about" },
] as const;

export const STATUS_LABELS: Record<string, string> = {
  proposed: "Proposed",
  contested: "Contested",
  approved: "Approved",
  withdrawn: "Withdrawn",
  blocked: "Blocked",
  canceled: "Canceled",
  delayed: "Delayed",
  operating: "Operating",
  under_construction: "Under Construction",
};

// Verification tiers — how solid an entry is, shown on every tracker surface.
export const TIER_LABELS: Record<string, string> = {
  verified: "Verified",
  corroborated: "Reported", // public-facing wording: sourced but not yet human-verified
  lead: "Lead",
};

export const TIER_STYLES: Record<string, string> = {
  verified: "bg-emerald-50 text-emerald-800 border-emerald-300",
  corroborated: "bg-amber-50 text-amber-800 border-amber-300",
  lead: "bg-slate-100 text-slate-600 border-slate-300",
};

// Status → badge styling (Tailwind classes), used by tracker UI.
export const STATUS_STYLES: Record<string, string> = {
  proposed: "bg-primary/10 text-primary border-primary/30",
  contested: "bg-accent/10 text-accent-dark border-accent/30",
  approved: "bg-amber-50 text-amber-800 border-amber-300",
  withdrawn: "bg-emerald-50 text-emerald-800 border-emerald-300",
  blocked: "bg-emerald-50 text-emerald-800 border-emerald-300",
  canceled: "bg-emerald-50 text-emerald-800 border-emerald-300",
  delayed: "bg-slate-100 text-slate-700 border-slate-300",
  operating: "bg-slate-100 text-slate-700 border-slate-300",
  under_construction: "bg-orange-50 text-orange-800 border-orange-300",
};

export const US_STATES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "District of Columbia",
};
