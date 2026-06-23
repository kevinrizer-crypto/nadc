import { db } from "@/db";
import { subscribers, donations } from "@/db/schema";
import { sql } from "drizzle-orm";

/**
 * Marketing attribution report: confirmed emails and donations grouped by
 * first-touch UTM source/campaign. Enter spend (from each ad platform's
 * dashboard) against these to get true cost-per-email and cost-per-donor.
 */
export default async function AdminAttributionPage() {
  // Confirmed subscribers by source/campaign.
  const emailRows = await db
    .select({
      source: sql<string>`coalesce(${subscribers.attribution}->>'source', '(none)')`,
      campaign: sql<string>`coalesce(${subscribers.attribution}->>'campaign', '—')`,
      n: sql<number>`count(*)::int`,
    })
    .from(subscribers)
    .where(sql`${subscribers.emailStatus} = 'confirmed'`)
    .groupBy(sql`1`, sql`2`)
    .orderBy(sql`3 desc`);

  // Completed/active donations by source/campaign, with totals.
  const donationRows = await db
    .select({
      source: sql<string>`coalesce(${donations.attribution}->>'source', '(none)')`,
      campaign: sql<string>`coalesce(${donations.attribution}->>'campaign', '—')`,
      donors: sql<number>`count(*)::int`,
      recurring: sql<number>`count(*) filter (where ${donations.recurring})::int`,
      totalCents: sql<number>`coalesce(sum(${donations.amountCents}), 0)::int`,
    })
    .from(donations)
    .where(sql`${donations.status} IN ('completed', 'active')`)
    .groupBy(sql`1`, sql`2`)
    .orderBy(sql`5 desc`);

  return (
    <div>
      <h1 className="font-display text-3xl text-primary mb-2">Attribution</h1>
      <p className="font-body text-sm text-slate-500 mb-8 max-w-2xl">
        First-touch source of confirmed subscribers and donors. Pull spend from each ad platform&apos;s dashboard and
        divide by these counts for true cost-per-email and cost-per-donor by campaign. Tag ad links with{" "}
        <code className="font-mono text-xs">?utm_source=reddit&amp;utm_campaign=…</code>.
      </p>

      <section className="mb-10">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400 mb-3">Confirmed email subscribers</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#CCCCCC]">
                {["Source", "Campaign", "Confirmed emails"].map((h) => (
                  <th key={h} className="font-mono text-2xs uppercase tracking-[0.15em] text-slate-400 px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {emailRows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-4 font-body text-sm text-slate-500">
                    No confirmed subscribers yet.
                  </td>
                </tr>
              )}
              {emailRows.map((r, i) => (
                <tr key={i} className="border-b border-[#EEEEEE] last:border-0">
                  <td className="px-4 py-2 font-mono text-xs">{r.source}</td>
                  <td className="px-4 py-2 font-mono text-xs">{r.campaign}</td>
                  <td className="px-4 py-2 font-mono text-xs">{r.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400 mb-3">Donations</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#CCCCCC]">
                {["Source", "Campaign", "Donors", "Monthly", "Total"].map((h) => (
                  <th key={h} className="font-mono text-2xs uppercase tracking-[0.15em] text-slate-400 px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {donationRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 font-body text-sm text-slate-500">
                    No completed donations yet.
                  </td>
                </tr>
              )}
              {donationRows.map((r, i) => (
                <tr key={i} className="border-b border-[#EEEEEE] last:border-0">
                  <td className="px-4 py-2 font-mono text-xs">{r.source}</td>
                  <td className="px-4 py-2 font-mono text-xs">{r.campaign}</td>
                  <td className="px-4 py-2 font-mono text-xs">{r.donors}</td>
                  <td className="px-4 py-2 font-mono text-xs">{r.recurring}</td>
                  <td className="px-4 py-2 font-mono text-xs">${(r.totalCents / 100).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
