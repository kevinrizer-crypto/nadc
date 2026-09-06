import type { Metadata } from "next";
import Link from "next/link";
import { getApprovedNews, getPublishedPosts } from "@/lib/queries";
import { formatDateUTC } from "@/lib/dates";
import SubscribeForm from "@/components/SubscribeForm";

export const metadata: Metadata = {
  title: "News — The Grid & Analysis",
  description:
    "The Grid is NADC's weekly national roundup of data center filings, hearings, and fight outcomes — plus original analysis.",
  alternates: { canonical: "/news" },
};

export const revalidate = 300;

export default async function NewsPage() {
  const [posts, coverage] = await Promise.all([
    getPublishedPosts().catch(() => []),
    getApprovedNews(24).catch(() => []),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <p className="section-label">News</p>
      <h1 className="font-display text-4xl sm:text-5xl text-primary mb-4">The Grid &amp; analysis</h1>
      <p className="font-body text-base text-slate-500 mb-12">
        One weekly roundup of every filing, hearing, and outcome nationwide — plus original analysis. Sourced,
        fact-checked, free.
      </p>

      {posts.length === 0 ? (
        <div className="card p-8 mb-10">
          <p className="font-body text-sm text-slate-500">
            No posts published yet — the first issue of The Grid ships with launch. Subscribe below to get it.
          </p>
        </div>
      ) : (
        <ul className="space-y-6 mb-12">
          {posts.map((post) => (
            <li key={post.id} className="card p-6">
              <p className="font-mono text-2xs uppercase tracking-[0.2em] text-slate-400 mb-2">
                {post.kind === "roundup" ? "The Grid" : "Analysis"}
                {post.publishedAt &&
                  ` · ${new Date(post.publishedAt).toLocaleDateString("en-US", { dateStyle: "long" })}`}
              </p>
              <Link href={`/news/${post.slug}`} className="font-display text-2xl text-primary hover:underline">
                {post.title}
              </Link>
              {post.excerpt && <p className="font-body text-sm text-slate-500 mt-2">{post.excerpt}</p>}
            </li>
          ))}
        </ul>
      )}

      {/* Coverage from other outlets. Curated, not scraped: every link here was
          approved by hand in /admin/news, and we send readers to the original
          publisher rather than reproducing their reporting. */}
      {coverage.length > 0 && (
        <section className="mb-12">
          <p className="section-label">In the news</p>
          <h2 className="font-display text-3xl text-primary mb-2">Data centers in the headlines</h2>
          <p className="font-body text-sm text-slate-500 mb-6">
            Reporting from local and national outlets on proposals, hearings, and the fights around them. We link out
            rather than republish, and every link is reviewed by hand before it appears here.
          </p>
          <ul className="divide-y divide-[#E5E5E5] border-t border-b border-[#E5E5E5]">
            {coverage.map((item) => (
              <li key={item.id} className="py-4">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body font-semibold text-ink hover:text-primary"
                >
                  {item.title}
                </a>
                <p className="font-mono text-2xs uppercase tracking-[0.15em] text-slate-400 mt-1">
                  {item.publisher ?? "Source"}
                  {item.publishedAt && ` · ${formatDateUTC(item.publishedAt)}`}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="card p-6">
        <h2 className="font-body font-semibold text-ink mb-1">Subscribe to The Grid</h2>
        <p className="font-body text-sm text-slate-500 mb-4">Weekly, free, unsubscribe anytime.</p>
        <SubscribeForm compact />
      </div>
    </div>
  );
}
