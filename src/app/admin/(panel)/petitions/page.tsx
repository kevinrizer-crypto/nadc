import { db } from "@/db";
import { petitions, petitionSignatures, projects } from "@/db/schema";
import { desc, count, eq } from "drizzle-orm";
import { savePetition } from "../actions";

export default async function AdminPetitionsPage() {
  const all = await db
    .select({
      petition: petitions,
      signatures: count(petitionSignatures.id),
    })
    .from(petitions)
    .leftJoin(petitionSignatures, eq(petitionSignatures.petitionId, petitions.id))
    .groupBy(petitions.id)
    .orderBy(desc(petitions.createdAt));
  const allProjects = await db.select({ id: projects.id, name: projects.name, state: projects.state }).from(projects);

  return (
    <div>
      <h1 className="font-display text-3xl text-primary mb-8">Petitions</h1>

      <section className="card p-6 mb-10">
        <h2 className="font-body font-semibold text-ink mb-4">New petition</h2>
        <form action={savePetition} className="space-y-4">
          <label className="block">
            <span className="label">Title</span>
            <input type="text" name="title" required className="input" />
          </label>
          <label className="block">
            <span className="label">Body (Markdown)</span>
            <textarea name="body" rows={6} required className="input font-mono text-xs" />
          </label>
          <div className="grid sm:grid-cols-3 gap-4">
            <label className="block">
              <span className="label">Linked project</span>
              <select name="projectId" className="input">
                <option value="">None</option>
                {allProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.state})
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Goal</span>
              <input type="number" name="goal" defaultValue={500} min={10} className="input" />
            </label>
            <label className="flex items-center gap-2 font-body text-sm pt-6">
              <input type="checkbox" name="active" defaultChecked />
              Active
            </label>
          </div>
          <button className="btn-primary">Create petition</button>
        </form>
      </section>

      <ul className="card divide-y divide-[#EEEEEE]">
        {all.length === 0 && <li className="px-5 py-4 font-body text-sm text-slate-500">No petitions yet.</li>}
        {all.map(({ petition, signatures }) => (
          <li key={petition.id} className="px-5 py-3 flex justify-between items-center gap-3">
            <div>
              <p className="font-body font-semibold text-sm text-ink">{petition.title}</p>
              <p className="font-mono text-2xs text-slate-400">
                {signatures} / {petition.goal} signatures · {petition.active ? "active" : "closed"} · /act/petitions/{petition.slug}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
