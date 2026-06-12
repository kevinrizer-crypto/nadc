import Link from "next/link";
import { db } from "@/db";
import { tips, projects, subscribers, donations, orders } from "@/db/schema";
import { count, eq, sql } from "drizzle-orm";

export default async function AdminDashboard() {
  const [pendingTips] = await db.select({ n: count() }).from(tips).where(eq(tips.status, "pending"));
  const [unpublished] = await db.select({ n: count() }).from(projects).where(eq(projects.published, false));
  const [stale] = await db
    .select({ n: count() })
    .from(projects)
    .where(sql`${projects.published} = true AND (${projects.verifiedAt} IS NULL OR ${projects.verifiedAt} < now() - interval '60 days')`);
  const [confirmedSubs] = await db.select({ n: count() }).from(subscribers).where(eq(subscribers.emailStatus, "confirmed"));
  const [activeDonors] = await db.select({ n: count() }).from(donations).where(eq(donations.status, "active"));
  const [paidOrders] = await db.select({ n: count() }).from(orders).where(eq(orders.status, "paid"));

  const cards = [
    { label: "Pending tips", value: pendingTips.n, href: "/admin/tips", urgent: pendingTips.n > 0 },
    { label: "Unpublished projects", value: unpublished.n, href: "/admin/projects" },
    { label: "Stale verifications (60d+)", value: stale.n, href: "/admin/projects", urgent: stale.n > 0 },
    { label: "Confirmed subscribers", value: confirmedSubs.n, href: "/admin/subscribers" },
    { label: "Active monthly Neighbors", value: activeDonors.n, href: "/admin/donations" },
    { label: "Orders to fulfill", value: paidOrders.n, href: "/admin/orders", urgent: paidOrders.n > 0 },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl text-primary mb-8">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className={`card p-6 hover:border-primary/40 ${c.urgent ? "border-accent/40" : ""}`}>
            <p className="font-display text-4xl text-primary">{c.value}</p>
            <p className="font-body text-sm text-slate-500 mt-1">{c.label}</p>
          </Link>
        ))}
      </div>
      <p className="font-body text-xs text-slate-400 mt-8">
        Editorial reminder: nothing publishes without at least one source, and stale entries (60+ days since
        verification) should be re-checked against their sources.
      </p>
    </div>
  );
}
