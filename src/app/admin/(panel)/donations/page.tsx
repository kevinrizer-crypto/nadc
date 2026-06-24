import { db } from "@/db";
import { donations } from "@/db/schema";
import { desc, eq, sum, count, ne } from "drizzle-orm";

export default async function AdminDonationsPage() {
  // Only real donations — exclude "pending", which are checkout sessions that
  // were started but never paid (abandoned carts).
  const recent = await db
    .select()
    .from(donations)
    .where(ne(donations.status, "pending"))
    .orderBy(desc(donations.createdAt))
    .limit(100);
  const [active] = await db
    .select({ n: count(), total: sum(donations.amountCents) })
    .from(donations)
    .where(eq(donations.status, "active"));
  const [pending] = await db.select({ n: count() }).from(donations).where(eq(donations.status, "pending"));

  return (
    <div>
      <h1 className="font-display text-3xl text-primary mb-2">Donations</h1>
      <p className="font-mono text-xs text-slate-500 mb-8">
        {active.n} active monthly Neighbors · ${(Number(active.total ?? 0) / 100).toFixed(0)}/mo recurring run-rate
        {pending.n > 0 && ` · ${pending.n} incomplete checkout${pending.n === 1 ? "" : "s"} hidden`}
      </p>
      <div className="card overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#CCCCCC]">
              {["Date", "Email", "Amount", "Type", "Status"].map((h) => (
                <th key={h} className="font-mono text-2xs uppercase tracking-[0.15em] text-slate-400 px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-4 font-body text-sm text-slate-500">
                  No donations yet.
                </td>
              </tr>
            )}
            {recent.map((d) => (
              <tr key={d.id} className="border-b border-[#EEEEEE] last:border-0">
                <td className="px-4 py-2 font-mono text-xs">{new Date(d.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-2 font-mono text-xs">{d.email ?? "—"}</td>
                <td className="px-4 py-2 font-mono text-xs">${(d.amountCents / 100).toFixed(2)}</td>
                <td className="px-4 py-2 font-mono text-xs">{d.recurring ? "monthly" : "one-time"}</td>
                <td className="px-4 py-2 font-mono text-xs">{d.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
