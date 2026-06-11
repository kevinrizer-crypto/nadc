import Link from "next/link";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { desc } from "drizzle-orm";

export default async function AdminPostsPage() {
  const all = await db.select().from(posts).orderBy(desc(posts.updatedAt));
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display text-3xl text-primary">Posts</h1>
        <Link href="/admin/posts/new" className="btn-primary !py-2 !px-4 text-sm">
          New post
        </Link>
      </div>
      <ul className="card divide-y divide-[#EEEEEE]">
        {all.length === 0 && <li className="px-5 py-4 font-body text-sm text-slate-500">No posts yet.</li>}
        {all.map((p) => (
          <li key={p.id} className="px-5 py-3 flex justify-between items-center gap-3">
            <div>
              <Link href={`/admin/posts/${p.id}`} className="font-body font-semibold text-sm text-primary hover:underline">
                {p.title}
              </Link>
              <p className="font-mono text-2xs text-slate-400">
                {p.kind} · {p.published ? `published ${p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : ""}` : "draft"}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
