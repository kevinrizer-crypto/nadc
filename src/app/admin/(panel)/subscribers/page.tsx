import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { desc, count, eq } from "drizzle-orm";

export default async function AdminSubscribersPage() {
  const recent = await db.select().from(subscribers).orderBy(desc(subscribers.createdAt)).limit(100);
  const [confirmed] = await db.select({ n: count() }).from(subscribers).where(eq(subscribers.emailStatus, "confirmed"));
  const [pending] = await db.select({ n: count() }).from(subscribers).where(eq(subscribers.emailStatus, "pending"));
  const [smsConfirmed] = await db.select({ n: count() }).from(subscribers).where(eq(subscribers.smsStatus, "confirmed"));

  return (
    <div>
      <h1 className="font-display text-3xl text-primary mb-2">Subscribers</h1>
      <p className="font-mono text-xs text-slate-500 mb-8">
        {confirmed.n} confirmed email · {pending.n} pending · {smsConfirmed.n} SMS opted-in
      </p>
      <p className="font-body text-xs text-slate-400 mb-6">
        Newsletter sends happen in your ESP (Resend Broadcasts) against synced contacts — this table is the source of
        truth for consent. Showing the 100 most recent.
      </p>
      <div className="card overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#CCCCCC]">
              {["Email", "Phone", "Email status", "SMS status", "Preferences", "Joined"].map((h) => (
                <th key={h} className="font-mono text-2xs uppercase tracking-[0.15em] text-slate-400 px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.map((s) => (
              <tr key={s.id} className="border-b border-[#EEEEEE] last:border-0">
                <td className="px-4 py-2 font-mono text-xs">{s.email ?? "—"}</td>
                <td className="px-4 py-2 font-mono text-xs">{s.phone ?? "—"}</td>
                <td className="px-4 py-2 font-mono text-xs">{s.emailStatus ?? "—"}</td>
                <td className="px-4 py-2 font-mono text-xs">{s.smsStatus ?? "—"}</td>
                <td className="px-4 py-2 font-mono text-2xs text-slate-500">
                  {[
                    s.preferences.national && "national",
                    s.preferences.states.length > 0 && `states: ${s.preferences.states.join(",")}`,
                    s.preferences.zips.length > 0 && `zips: ${s.preferences.zips.join(",")}`,
                    s.preferences.projectIds.length > 0 && `projects: ${s.preferences.projectIds.join(",")}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </td>
                <td className="px-4 py-2 font-mono text-2xs text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
