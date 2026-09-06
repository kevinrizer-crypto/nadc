import { db } from "@/db";
import { newsItems, projects } from "@/db/schema";
import { desc, eq, asc } from "drizzle-orm";
import { setNewsStatus } from "../actions";
import { formatDateUTC } from "@/lib/dates";

export const dynamic = "force-dynamic";

/**
 * Approval queue for external coverage.
 *
 * `scripts/fetch-news.ts` files everything it finds here as `pending`, and
 * nothing reaches the public site until it is approved. That split is what
 * lets the feed queries stay broad without risking what gets published.
 */
export default async function AdminNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = status === "approved" || status === "rejected" ? status : "pending";

  const [items, trackedProjects] = await Promise.all([
    db
      .select()
      .from(newsItems)
      .where(eq(newsItems.status, filter))
      .orderBy(desc(newsItems.publishedAt), desc(newsItems.id))
      .limit(200),
    db.select({ id: projects.id, name: projects.name, state: projects.state }).from(projects).orderBy(asc(projects.name)),
  ]);

  const tabs = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl text-primary mb-2">News queue</h1>
      <p className="font-body text-sm text-slate-500 mb-6">
        Stories found by the monitor (<code className="font-mono text-xs">npm run news:fetch</code>). Nothing here is
        public until you approve it. Attaching a story to a tracked project is what corroborates that project.
      </p>

      <nav aria-label="Filter by status" className="flex gap-3 mb-8">
        {tabs.map((t) => (
          <a
            key={t.key}
            href={`/admin/news?status=${t.key}`}
            className={`font-body text-sm px-3 py-1.5 rounded-sm border ${
              filter === t.key ? "border-primary text-primary bg-primary/5" : "border-[#CCCCCC] text-slate-600"
            }`}
          >
            {t.label}
          </a>
        ))}
      </nav>

      {items.length === 0 ? (
        <p className="font-body text-sm text-slate-500">
          Nothing {filter}. Run <code className="font-mono text-xs">npm run news:fetch -- --commit</code> to scan for
          new stories.
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="card p-5">
              <p className="font-mono text-2xs uppercase tracking-[0.15em] text-slate-400 mb-1">
                {item.publisher ?? "unknown publisher"}
                {item.publishedAt && ` · ${formatDateUTC(item.publishedAt)}`}
                <span aria-hidden="true"> · </span>
                {item.discoveredVia}
              </p>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body font-semibold text-ink hover:text-primary block mb-1"
              >
                {item.title}
              </a>
              {item.summary && <p className="font-body text-sm text-slate-500 mb-3">{item.summary.slice(0, 240)}</p>}

              <form action={setNewsStatus} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={item.id} />
                <label className="flex items-center gap-2">
                  <span className="font-body text-xs text-slate-500">Attach to project</span>
                  <select name="projectId" defaultValue={item.projectId ?? ""} className="input py-1 text-sm max-w-[16rem]">
                    <option value="">— none —</option>
                    {trackedProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.state})
                      </option>
                    ))}
                  </select>
                </label>
                {filter !== "approved" && (
                  <button type="submit" name="status" value="approved" className="btn-primary py-1.5 px-4 text-sm">
                    Approve
                  </button>
                )}
                {filter !== "rejected" && (
                  <button type="submit" name="status" value="rejected" className="btn-outline py-1.5 px-4 text-sm">
                    Reject
                  </button>
                )}
                {filter !== "pending" && (
                  <button type="submit" name="status" value="pending" className="btn-outline py-1.5 px-4 text-sm">
                    Back to pending
                  </button>
                )}
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
