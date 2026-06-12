import { db } from "@/db";
import { tips } from "@/db/schema";
import { desc } from "drizzle-orm";
import { setTipStatus, promoteTip } from "../actions";

export default async function AdminTipsPage() {
  const allTips = await db.select().from(tips).orderBy(desc(tips.createdAt)).limit(200);

  return (
    <div>
      <h1 className="font-display text-3xl text-primary mb-2">Tip moderation queue</h1>
      <p className="font-body text-sm text-slate-500 mb-8">
        Verify against public records before promoting. Promoting creates an <strong>unpublished draft</strong> project
        — publication is a separate, deliberate step. Tipster contact info is sensitive: it never leaves this queue.
      </p>

      {allTips.length === 0 ? (
        <p className="font-body text-sm text-slate-500">No tips yet.</p>
      ) : (
        <ul className="space-y-4">
          {allTips.map((tip) => (
            <li key={tip.id} className="card p-5">
              <div className="flex flex-wrap justify-between gap-2 mb-2">
                <p className="font-body font-semibold text-sm text-ink">
                  #{tip.id} · {tip.locationText} {tip.state && `(${tip.state}${tip.zip ? ` ${tip.zip}` : ""})`}
                </p>
                <p className="font-mono text-2xs text-slate-400">
                  {tip.status.toUpperCase()} · {new Date(tip.createdAt).toLocaleString()}
                </p>
              </div>
              <p className="font-body text-sm text-slate-600 whitespace-pre-wrap mb-2">{tip.message}</p>
              {(tip.links as string[]).length > 0 && (
                <ul className="mb-2">
                  {(tip.links as string[]).map((l) => (
                    <li key={l}>
                      <a href={l} className="font-mono text-xs text-primary underline break-all" rel="noopener" target="_blank">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <p className="font-mono text-2xs text-slate-400 mb-3">
                Reporter: {tip.reporterName ?? "anonymous"} · {tip.reporterEmail}
              </p>
              {tip.adminNotes && <p className="font-body text-xs text-amber-800 bg-amber-50 p-2 rounded-sm mb-3">Notes: {tip.adminNotes}</p>}

              {tip.status === "pending" || tip.status === "reviewing" ? (
                <div className="flex flex-wrap gap-2">
                  <form action={promoteTip}>
                    <input type="hidden" name="id" value={tip.id} />
                    <button className="btn-primary !py-1.5 !px-3 text-xs">Promote to draft project</button>
                  </form>
                  {(["reviewing", "rejected", "duplicate"] as const).map((s) => (
                    <form key={s} action={setTipStatus}>
                      <input type="hidden" name="id" value={tip.id} />
                      <input type="hidden" name="status" value={s} />
                      <button className="btn-outline !py-1.5 !px-3 text-xs capitalize">{s}</button>
                    </form>
                  ))}
                </div>
              ) : tip.promotedProjectId ? (
                <a href={`/admin/projects/${tip.promotedProjectId}`} className="font-body text-xs text-primary underline">
                  View draft project #{tip.promotedProjectId} →
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
