import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getPetitionBySlug } from "@/lib/queries";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { renderMarkdown } from "@/lib/content";
import PetitionSignForm from "@/components/PetitionSignForm";

export const revalidate = 120;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const petition = await getPetitionBySlug(slug).catch(() => null);
  if (!petition) return {};
  return {
    title: petition.title,
    description: petition.body.slice(0, 160),
    alternates: { canonical: `/act/petitions/${slug}` },
  };
}

export default async function PetitionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const petition = await getPetitionBySlug(slug); // DB errors throw → error boundary, not a false 404
  if (!petition || !petition.active) notFound();

  const project = petition.projectId
    ? (await db.select().from(projects).where(eq(projects.id, petition.projectId)).limit(1))[0]
    : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <nav aria-label="Breadcrumb" className="font-mono text-2xs text-slate-400 uppercase tracking-[0.2em] mb-6">
        <Link href="/act/petitions" className="hover:text-primary">
          Petitions
        </Link>
      </nav>
      <h1 className="font-display text-4xl text-primary leading-tight mb-4">{petition.title}</h1>
      {project && (
        <p className="font-body text-sm text-slate-500 mb-6">
          Related project:{" "}
          <Link href={`/tracker/${project.state.toLowerCase()}/${project.slug}`} className="text-primary underline">
            {project.name} — {project.city}, {project.state}
          </Link>
        </p>
      )}

      <p className="font-mono text-xs text-slate-400 mb-2">
        {petition.signatureCount.toLocaleString()} of {petition.goal.toLocaleString()} signatures
      </p>
      <div className="h-2 bg-paper rounded-sm overflow-hidden mb-8">
        <div
          className="h-full bg-accent"
          style={{ width: `${Math.min(100, (petition.signatureCount / petition.goal) * 100)}%` }}
        />
      </div>

      <div className="prose-nadc mb-10" dangerouslySetInnerHTML={{ __html: renderMarkdown(petition.body) }} />

      <PetitionSignForm petitionId={petition.id} />
    </div>
  );
}
