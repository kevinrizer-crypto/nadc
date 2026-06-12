import Link from "next/link";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { desc } from "drizzle-orm";
import StatusBadge from "@/components/StatusBadge";
import TierBadge from "@/components/TierBadge";
import { deleteProject } from "../actions";

export default async function AdminProjectsPage() {
  const all = await db.select().from(projects).orderBy(desc(projects.updatedAt));
  const staleCutoff = Date.now() - 60 * 24 * 3600 * 1000;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display text-3xl text-primary">Tracker projects</h1>
        <Link href="/admin/projects/new" className="btn-primary !py-2 !px-4 text-sm">
          New project
        </Link>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#CCCCCC]">
              {["Project", "Location", "Status", "Tier", "Published", "Verified", ""].map((h, i) => (
                <th key={i} className="font-mono text-2xs uppercase tracking-[0.15em] text-slate-400 px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {all.map((p) => {
              const stale = !p.verifiedAt || new Date(p.verifiedAt).getTime() < staleCutoff;
              return (
                <tr key={p.id} className="border-b border-[#EEEEEE] last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/projects/${p.id}`} className="font-body font-semibold text-sm text-primary hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-slate-600">
                    {[p.city, p.state].filter(Boolean).join(", ")}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} detail={p.statusDetail} />
                  </td>
                  <td className="px-4 py-3">
                    <TierBadge tier={p.verificationTier} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{p.published ? "✓" : "draft"}</td>
                  <td className={`px-4 py-3 font-mono text-xs ${stale ? "text-accent" : "text-slate-500"}`}>
                    {p.verifiedAt ? new Date(p.verifiedAt).toLocaleDateString() : "never"}
                    {stale && " ⚠"}
                  </td>
                  <td className="px-4 py-3">
                    <form action={deleteProject} className="inline">
                      <input type="hidden" name="id" value={p.id} />
                      <button className="font-body text-xs text-accent underline" aria-label={`Delete ${p.name}`}>
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
