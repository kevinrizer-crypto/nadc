import type { Metadata } from "next";
import Link from "next/link";
import { getActivePetitions } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Act — Petitions, Letters, Donations",
  description:
    "Sign a petition, write your officials with a letter built on the playbook, support the research, or volunteer. Channel the worry into informed action.",
  alternates: { canonical: "/act" },
};

export const revalidate = 300;

export default async function ActPage() {
  const petitions = await getActivePetitions().catch(() => []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-2xl mb-14">
        <p className="section-label">Take Action</p>
        <h1 className="font-display text-4xl sm:text-5xl text-primary mb-4">Act</h1>
        <p className="font-body text-base text-slate-500 leading-relaxed">
          Worry doesn&apos;t change votes. Records requests, letters, signatures, and turnout do.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {[
          {
            href: "/act/petitions",
            label: "Petitions",
            text: "Add your name to active petitions tied to tracked projects.",
          },
          {
            href: "/act/officials",
            label: "Write Your Officials",
            text: "Find your representatives by address and send a letter built on the playbook.",
          },
          { href: "/donate", label: "Donate", text: "Become a monthly Neighbor and keep the research free." },
          {
            href: "/about#contact",
            label: "Volunteer",
            text: "Researchers, designers, organizers, and attorneys — we need you.",
          },
        ].map((c) => (
          <Link key={c.href} href={c.href} className="card p-6 hover:border-primary/40 transition-colors block">
            <h2 className="font-display text-xl text-primary mb-2">{c.label}</h2>
            <p className="font-body text-sm text-slate-500">{c.text}</p>
          </Link>
        ))}
      </div>

      <section>
        <h2 className="font-display text-3xl text-primary mb-6">Active petitions</h2>
        {petitions.length === 0 ? (
          <div className="card p-8">
            <p className="font-body text-sm text-slate-500">
              No active petitions yet — petitions launch alongside specific project fights.{" "}
              <Link href="/report" className="text-primary underline">
                Report a project
              </Link>{" "}
              or{" "}
              <Link href="/subscribe" className="text-primary underline">
                subscribe
              </Link>{" "}
              to hear when one starts near you.
            </p>
          </div>
        ) : (
          <ul className="grid md:grid-cols-2 gap-6">
            {petitions.map(({ petition, signatureCount }) => (
              <li key={petition.id} className="card p-6">
                <Link href={`/act/petitions/${petition.slug}`} className="font-body font-semibold text-ink hover:text-primary">
                  {petition.title}
                </Link>
                <p className="font-mono text-xs text-slate-400 mt-2">
                  {signatureCount.toLocaleString()} of {petition.goal.toLocaleString()} signatures
                </p>
                <div className="h-2 bg-paper rounded-sm mt-2 overflow-hidden" role="presentation">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${Math.min(100, (signatureCount / petition.goal) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
