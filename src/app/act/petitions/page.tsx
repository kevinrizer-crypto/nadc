import type { Metadata } from "next";
import Link from "next/link";
import { getActivePetitions } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Petitions",
  description: "Active NADC petitions tied to tracked data center projects.",
  alternates: { canonical: "/act/petitions" },
};

export const revalidate = 120;

export default async function PetitionsPage() {
  const petitions = await getActivePetitions().catch(() => []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <p className="section-label">Act</p>
      <h1 className="font-display text-4xl sm:text-5xl text-primary mb-4">Petitions</h1>
      <p className="font-body text-base text-slate-500 mb-10">
        Each petition is tied to a tracked project and delivered to the decision-makers on the record. Signing offers
        an optional subscription — we never auto-subscribe you.
      </p>

      {petitions.length === 0 ? (
        <div className="card p-8">
          <p className="font-body text-sm text-slate-500">
            No active petitions yet. Petitions launch alongside specific fights — when a hearing is scheduled and
            signatures can change the outcome.{" "}
            <Link href="/subscribe" className="text-primary underline">
              Subscribe
            </Link>{" "}
            to hear the moment one starts near you.
          </p>
        </div>
      ) : (
        <ul className="space-y-6">
          {petitions.map(({ petition, signatureCount }) => (
            <li key={petition.id} className="card p-6">
              <Link href={`/act/petitions/${petition.slug}`} className="font-display text-2xl text-primary hover:underline">
                {petition.title}
              </Link>
              <p className="font-mono text-xs text-slate-400 mt-2 mb-2">
                {signatureCount.toLocaleString()} of {petition.goal.toLocaleString()} signatures
              </p>
              <div className="h-2 bg-paper rounded-sm overflow-hidden mb-4">
                <div className="h-full bg-accent" style={{ width: `${Math.min(100, (signatureCount / petition.goal) * 100)}%` }} />
              </div>
              <Link href={`/act/petitions/${petition.slug}`} className="btn-primary !py-2 !px-4 text-sm">
                Read &amp; sign
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
