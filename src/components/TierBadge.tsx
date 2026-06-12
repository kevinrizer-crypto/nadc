import { TIER_LABELS, TIER_STYLES } from "@/lib/site";

const TIER_TITLES: Record<string, string> = {
  verified: "Confirmed by NADC against primary sources",
  corroborated: "Reported by multiple independent sources — not yet human-verified",
  lead: "Single-source lead — pending review",
};

export default function TierBadge({ tier }: { tier: string }) {
  return (
    <span
      className={`inline-block border rounded-sm px-2 py-0.5 font-mono text-2xs uppercase tracking-wider ${
        TIER_STYLES[tier] ?? TIER_STYLES.lead
      }`}
      title={TIER_TITLES[tier]}
    >
      {tier === "verified" ? "✓ " : ""}
      {TIER_LABELS[tier] ?? tier}
    </span>
  );
}
