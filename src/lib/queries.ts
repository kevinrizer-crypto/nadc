import { db } from "@/db";
import { projects, petitions, petitionSignatures, posts, subscribers, products } from "@/db/schema";
import { and, eq, desc, sql, count } from "drizzle-orm";

/**
 * Read-side queries for public pages. All public reads filter on
 * published=true; unpublished/in-review entries never leak.
 *
 * Pages using these run with `export const revalidate` so counts stay fresh
 * without hitting the DB on every request.
 */

export type PublicProject = typeof projects.$inferSelect;

export async function getPublishedProjects(): Promise<PublicProject[]> {
  return db.select().from(projects).where(eq(projects.published, true)).orderBy(projects.state, projects.name);
}

export async function getProjectBySlug(state: string, slug: string): Promise<PublicProject | null> {
  const rows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.published, true), eq(projects.state, state.toUpperCase()), eq(projects.slug, slug)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getHomeCounters() {
  const [projectCount] = await db.select({ n: count() }).from(projects).where(eq(projects.published, true));
  const [activeFights] = await db
    .select({ n: count() })
    .from(projects)
    .where(and(eq(projects.published, true), sql`${projects.status} IN ('contested','proposed','delayed')`));
  const [wins] = await db
    .select({ n: count() })
    .from(projects)
    .where(and(eq(projects.published, true), sql`${projects.status} IN ('withdrawn','blocked','canceled')`));
  const [subs] = await db
    .select({ n: count() })
    .from(subscribers)
    .where(sql`${subscribers.emailStatus} = 'confirmed' OR ${subscribers.smsStatus} = 'confirmed'`);
  return {
    projectsTracked: projectCount?.n ?? 0,
    activeFights: activeFights?.n ?? 0,
    communityWins: wins?.n ?? 0,
    subscribers: subs?.n ?? 0,
  };
}

export async function getActivePetitions() {
  const rows = await db
    .select({
      petition: petitions,
      signatureCount: sql<number>`(SELECT count(*) FROM ${petitionSignatures} WHERE ${petitionSignatures.petitionId} = ${petitions.id})`,
    })
    .from(petitions)
    .where(eq(petitions.active, true))
    .orderBy(desc(petitions.createdAt));
  return rows;
}

export async function getPetitionBySlug(slug: string) {
  const rows = await db.select().from(petitions).where(eq(petitions.slug, slug)).limit(1);
  if (!rows[0]) return null;
  const [sigs] = await db
    .select({ n: count() })
    .from(petitionSignatures)
    .where(eq(petitionSignatures.petitionId, rows[0].id));
  return { ...rows[0], signatureCount: sigs?.n ?? 0 };
}

export async function getPublishedPosts(limit?: number) {
  const q = db
    .select()
    .from(posts)
    .where(eq(posts.published, true))
    .orderBy(desc(posts.publishedAt));
  return limit ? q.limit(limit) : q;
}

export async function getPostBySlug(slug: string) {
  const rows = await db.select().from(posts).where(and(eq(posts.published, true), eq(posts.slug, slug))).limit(1);
  return rows[0] ?? null;
}

export async function getActiveProducts() {
  return db.select().from(products).where(eq(products.active, true)).orderBy(products.sortOrder);
}

export async function getProductBySlug(slug: string) {
  const rows = await db.select().from(products).where(and(eq(products.active, true), eq(products.slug, slug))).limit(1);
  return rows[0] ?? null;
}
