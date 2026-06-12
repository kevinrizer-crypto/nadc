import type { Metadata } from "next";
import TipForm from "@/components/TipForm";

export const metadata: Metadata = {
  title: "Report a Proposed Data Center",
  description:
    "Heard a rumor, seen a rezoning notice, or found a filing? Report a proposed data center and NADC will verify it against public records and add it to the national tracker.",
  alternates: { canonical: "/report" },
};

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const { project } = await searchParams;
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <p className="section-label">Tip Line</p>
      <h1 className="font-display text-4xl sm:text-5xl text-primary mb-4">Report a Proposed Data Center</h1>
      <p className="font-body text-base text-slate-500 leading-relaxed mb-3">
        Tips from neighbors are how the national tracker grows. Tell us what you&apos;ve seen — a rezoning notice, a
        land purchase, a utility filing, a rumor at a county meeting. Our team verifies every report against public
        records before anything is published.
      </p>
      <p className="font-body text-sm text-slate-500 mb-10">
        <strong className="text-ink">Your identity is protected.</strong> Your name is optional, your contact details
        are never published, and we treat tipster information as sensitive data.
      </p>
      {project && (
        <div className="card border-primary/30 bg-primary/5 px-4 py-3 mb-8">
          <p className="font-body text-sm text-ink">
            You&apos;re confirming or correcting our entry for <strong>{project}</strong> — thank you. Tell us what you
            know: is the project real, has the status changed, what did we get wrong?
          </p>
        </div>
      )}
      <TipForm
        initialMessage={project ? `Regarding the tracked project "${project}": ` : ""}
      />
    </div>
  );
}
