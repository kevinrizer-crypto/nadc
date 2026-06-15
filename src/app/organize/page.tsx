import type { Metadata } from "next";
import Link from "next/link";
import { getPillar } from "@/lib/content";

export const metadata: Metadata = {
  title: "Organize — Find or Start a Local Group",
  description:
    "Find or start a local opposition group, get the town-hall toolkit, and learn to read a rezoning application. Communities that win start early, build a record, and show up in numbers.",
  alternates: { canonical: "/organize" },
};

export default function OrganizePage() {
  const playbook = getPillar("how-to-fight-playbook");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-2xl mb-14">
        <p className="section-label">Organize</p>
        <h1 className="font-display text-4xl sm:text-5xl text-primary mb-4">
          Communities that win start early, build a record, and show up in numbers.
        </h1>
        <p className="font-body text-base text-slate-500 leading-relaxed">
          Fifty neighbors showing up matters more than any single argument. Here&apos;s how to find each other — and
          what to do once you have.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-16">
        <section className="card p-7">
          <p className="section-label">Step one</p>
          <h2 className="font-display text-2xl text-primary mb-3">Find or start a local group</h2>
          <p className="font-body text-sm text-slate-600 leading-relaxed mb-4">
            Check your project&apos;s page in the{" "}
            <Link href="/tracker" className="text-primary underline">
              tracker
            </Link>{" "}
            for an existing local group. If none exists, start one: a named channel (Facebook group or mailing list),
            one weekly meeting, and three roles — a <strong>records person</strong>, a <strong>spokesperson</strong>,
            and a <strong>turnout organizer</strong>.
          </p>
          <p className="font-body text-sm text-slate-600 leading-relaxed mb-4">
            Then{" "}
            <Link href="/report" className="text-primary underline">
              register your group with NADC
            </Link>{" "}
            (use the tip form and mention your group) so neighbors searching the project find you — and so groups
            fighting the same developer elsewhere can share documents and tactics.
          </p>
        </section>

        <section className="card p-7">
          <p className="section-label">The playbook</p>
          <h2 className="font-display text-2xl text-primary mb-3">{playbook?.title ?? "How to fight a data center proposal"}</h2>
          <p className="font-body text-sm text-slate-600 leading-relaxed mb-4">{playbook?.metaDescription}</p>
          <Link href="/learn/how-to-fight-playbook" className="btn-primary !py-2 !px-4 text-sm">
            Read the full playbook
          </Link>
        </section>
      </div>

      <section className="mb-16">
        <h2 className="font-display text-3xl text-primary mb-6">Town-hall toolkit</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Records requests first",
              text: "Pull the rezoning application, utility will-serve letters, water studies, and any NDAs — they're public records. One resident's records request has exposed an entire project.",
            },
            {
              title: "Map the criteria",
              text: "Zoning boards rule on written standards: plan consistency, compatibility, infrastructure adequacy, traffic, noise. Assign each speaker one criterion.",
            },
            {
              title: "Experts beat volume",
              text: "One hydrologist or land-use attorney (even a few retained hours) plus twenty assigned speakers beats twenty identical angry comments.",
            },
            {
              title: "Make it visible",
              text: "Yard signs and door hangers turn private worry into visible consensus — officials count signs on their commute. Pack every hearing.",
            },
          ].map((c) => (
            <div key={c.title} className="card p-5">
              <h3 className="font-body font-semibold text-sm text-ink mb-2">{c.title}</h3>
              <p className="font-body text-xs text-slate-500 leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
        <p className="font-mono text-2xs text-slate-400 mt-3">
          Condensed from the playbook — every claim sourced there.{" "}
          <Link href="/learn/how-to-fight-playbook" className="text-primary underline">
            Full version with sources →
          </Link>
        </p>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="card p-7">
          <h2 className="font-display text-2xl text-primary mb-3">How to read a rezoning application</h2>
          <ul className="font-body text-sm text-slate-600 space-y-3 list-disc pl-5">
            <li>
              <strong>The use classification.</strong> Is it filed as &ldquo;data center,&rdquo; or as
              &ldquo;warehouse&rdquo;/&ldquo;light industrial&rdquo; to dodge a hearing? The classification controls
              which standards apply.
            </li>
            <li>
              <strong>By-right or discretionary?</strong> If the zoning already permits the use, there may be no
              hearing — your leverage shifts to permits, utilities, and ordinances. Learn this on day one.
            </li>
            <li>
              <strong>The site plan&apos;s edges.</strong> Setbacks, buffer zones, substation locations, and
              generator yards — the adjacency impacts live at the property line, not in the renderings.
            </li>
            <li>
              <strong>Phases and expansion rights.</strong> Approval language often covers far more buildout than the
              first phase shown to the public. Demand the full plan.
            </li>
            <li>
              <strong>Conditions and proffers.</strong> Promises in a press release are worth nothing; conditions in
              the development agreement are enforceable. Read what&apos;s actually binding.
            </li>
          </ul>
        </div>
        <div className="card p-7 bg-primary text-white border-primary">
          <h2 className="font-display text-2xl mb-3">Get the gear</h2>
          <p className="font-body text-sm text-white/85 leading-relaxed mb-5">
            Make a <strong>free, print-ready yard sign</strong> for your town in seconds, or order pre-printed signs,
            shirts, stickers, and the Organizer Kit bundle from the store.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/yard-sign" className="inline-block bg-white text-primary font-body font-semibold px-6 py-3 rounded-sm hover:bg-paper transition-colors">
              Make a free yard sign
            </Link>
            <Link href="/store" className="inline-block border border-white/60 text-white font-body font-semibold px-6 py-3 rounded-sm hover:bg-white/10 transition-colors">
              Visit the store
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
