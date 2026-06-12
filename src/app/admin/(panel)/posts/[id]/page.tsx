import { notFound } from "next/navigation";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { savePost } from "../../actions";

export default async function AdminPostEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const post = isNew ? null : (await db.select().from(posts).where(eq(posts.id, Number(id))).limit(1))[0];
  if (!isNew && !post) notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl text-primary mb-8">{isNew ? "New post" : `Edit: ${post!.title}`}</h1>
      <form action={savePost} className="space-y-5">
        {!isNew && <input type="hidden" name="id" value={post!.id} />}
        <label className="block">
          <span className="label">Title</span>
          <input type="text" name="title" required defaultValue={post?.title ?? ""} className="input" />
        </label>
        <div className="grid sm:grid-cols-2 gap-5">
          <label className="block">
            <span className="label">Slug</span>
            <input type="text" name="slug" defaultValue={post?.slug ?? ""} className="input" />
          </label>
          <label className="block">
            <span className="label">Kind</span>
            <select name="kind" defaultValue={post?.kind ?? "analysis"} className="input">
              <option value="roundup">The Grid (weekly roundup)</option>
              <option value="analysis">Analysis</option>
            </select>
          </label>
        </div>
        <label className="block">
          <span className="label">Excerpt</span>
          <textarea name="excerpt" rows={2} defaultValue={post?.excerpt ?? ""} className="input" />
        </label>
        <label className="block">
          <span className="label">Body (Markdown — cite sources inline; every stat needs a link)</span>
          <textarea name="bodyMd" rows={18} defaultValue={post?.bodyMd ?? ""} className="input font-mono text-xs" />
        </label>
        <label className="flex items-center gap-2 font-body text-sm text-ink">
          <input type="checkbox" name="published" defaultChecked={post?.published ?? false} />
          Published
        </label>
        <button type="submit" className="btn-primary">
          Save post
        </button>
      </form>
    </div>
  );
}
