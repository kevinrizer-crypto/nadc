import { notFound } from "next/navigation";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { saveProject } from "../../actions";
import { STATUS_LABELS, US_STATES } from "@/lib/site";

export default async function AdminProjectEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const project = isNew
    ? null
    : (await db.select().from(projects).where(eq(projects.id, Number(id))).limit(1))[0];
  if (!isNew && !project) notFound();

  const sourcesText = ((project?.sources ?? []) as { url: string; label?: string }[])
    .map((s) => [s.url, s.label].filter(Boolean).join(" "))
    .join("\n");

  const field = (label: string, name: string, value: string | number | null | undefined, type = "text", required = false) => (
    <label className="block">
      <span className="label">
        {label}
        {required && <span className="text-accent"> *</span>}
      </span>
      <input type={type} name={name} defaultValue={value ?? ""} required={required} className="input" step={type === "number" ? "any" : undefined} />
    </label>
  );

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl text-primary mb-8">{isNew ? "New project" : `Edit: ${project!.name}`}</h1>
      <form action={saveProject} className="space-y-5">
        {!isNew && <input type="hidden" name="id" value={project!.id} />}

        <div className="grid sm:grid-cols-2 gap-5">
          {field("Project name", "name", project?.name, "text", true)}
          {field("Slug (URL)", "slug", project?.slug)}
          {field("Developer", "developer", project?.developer)}
          <label className="block">
            <span className="label">
              State <span className="text-accent">*</span>
            </span>
            <select name="state" defaultValue={project?.state ?? ""} required className="input">
              <option value="">Select…</option>
              {Object.entries(US_STATES).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          {field("City", "city", project?.city)}
          {field("County", "county", project?.county)}
          {field("Nearest ZIP", "nearestZip", project?.nearestZip)}
          <label className="block">
            <span className="label">Status</span>
            <select name="status" defaultValue={project?.status ?? "proposed"} className="input">
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {field("Status detail (display text)", "statusDetail", project?.statusDetail)}
          {field("Latitude", "latitude", project?.latitude, "number")}
          {field("Longitude", "longitude", project?.longitude, "number")}
          {field("Capacity (MW / sq ft)", "capacity", project?.capacity)}
          {field("Investment", "investment", project?.investment)}
          {field("Municipality URL", "municipalityUrl", project?.municipalityUrl, "url")}
          {field("Opposition group", "oppositionGroup", project?.oppositionGroup)}
          {field("Opposition group URL", "oppositionGroupUrl", project?.oppositionGroupUrl, "url")}
          {field("Next hearing date", "nextHearingDate", project?.nextHearingDate, "date")}
          {field("Next hearing details", "nextHearingDetails", project?.nextHearingDetails)}
        </div>

        <label className="block">
          <span className="label">Notes (public &ldquo;What we know&rdquo;)</span>
          <textarea name="notes" rows={4} defaultValue={project?.notes ?? ""} className="input" />
        </label>

        <label className="block">
          <span className="label">Sources — one per line: URL, then optional label</span>
          <textarea name="sources" rows={4} defaultValue={sourcesText} className="input font-mono text-xs" placeholder="https://example.gov/agenda.pdf County agenda, Apr 2026" />
          <span className="font-body text-xs text-slate-400">Publishing requires at least one source. Never cite a source you haven&apos;t opened.</span>
        </label>

        <label className="block">
          <span className="label">Verification note (internal)</span>
          <textarea name="verificationNote" rows={2} defaultValue={project?.verificationNote ?? ""} className="input" />
        </label>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 font-body text-sm text-ink">
            <input type="checkbox" name="markVerified" />
            Mark verified as of today (I re-checked the sources)
          </label>
          <label className="flex items-center gap-2 font-body text-sm text-ink">
            <input type="checkbox" name="published" defaultChecked={project?.published ?? false} />
            Published (visible on the public tracker)
          </label>
        </div>

        <button type="submit" className="btn-primary">
          Save project
        </button>
      </form>
    </div>
  );
}
