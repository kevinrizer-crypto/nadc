import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getPostBySlug } from "@/lib/queries";
import { renderMarkdown } from "@/lib/content";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug).catch(() => null);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    alternates: { canonical: `/news/${slug}` },
    openGraph: { title: post.title, description: post.excerpt ?? undefined, type: "article" },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug); // DB errors throw → error boundary, not a false 404
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? undefined,
    datePublished: post.publishedAt ?? undefined,
    url: `${SITE_URL}/news/${slug}`,
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="font-mono text-2xs text-slate-400 uppercase tracking-[0.2em] mb-6">
        <Link href="/news" className="hover:text-primary">
          News
        </Link>{" "}
        / {post.kind === "roundup" ? "The Grid" : "Analysis"}
      </nav>
      <h1 className="font-display text-4xl sm:text-5xl text-primary leading-tight mb-4">{post.title}</h1>
      {post.publishedAt && (
        <p className="font-mono text-xs text-slate-400 mb-10">
          {new Date(post.publishedAt).toLocaleDateString("en-US", { dateStyle: "long" })}
        </p>
      )}
      <div className="prose-nadc" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.bodyMd) }} />
    </article>
  );
}
