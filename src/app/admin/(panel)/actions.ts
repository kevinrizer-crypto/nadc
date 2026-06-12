"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { projects, tips, posts, products, petitions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

/** All admin mutations live here; every action re-checks the session. */

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 150);
}

// --- Tips ---------------------------------------------------------------

export async function setTipStatus(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status")) as "pending" | "reviewing" | "promoted" | "rejected" | "duplicate";
  const adminNotes = formData.get("adminNotes") ? String(formData.get("adminNotes")) : undefined;
  await db.update(tips).set({ status, ...(adminNotes !== undefined ? { adminNotes } : {}) }).where(eq(tips.id, id));
  revalidatePath("/admin/tips");
}

/** Promote a tip to a draft (unpublished) tracker entry for verification. */
export async function promoteTip(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const tip = (await db.select().from(tips).where(eq(tips.id, id)).limit(1))[0];
  if (!tip) return;

  const name = `Unnamed project — ${tip.locationText.slice(0, 80)}`;
  const state = tip.state ?? "XX";
  const [project] = await db
    .insert(projects)
    .values({
      slug: slugify(`${tip.locationText}-${id}`),
      name,
      state,
      nearestZip: tip.zip,
      notes: tip.message,
      sources: (tip.links ?? []).map((url) => ({ url })),
      published: false, // never auto-publish: editorial verification first
      verificationNote: `Created from tip #${id}. Verify all details against public records before publishing.`,
    })
    .returning({ id: projects.id });

  await db.update(tips).set({ status: "promoted", promotedProjectId: project.id }).where(eq(tips.id, id));
  revalidatePath("/admin/tips");
  redirect(`/admin/projects/${project.id}`);
}

// --- Projects -----------------------------------------------------------

export async function saveProject(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") ? Number(formData.get("id")) : null;
  const str = (k: string) => {
    const v = formData.get(k);
    return v === null || String(v).trim() === "" ? null : String(v).trim();
  };

  const name = str("name");
  const state = (str("state") ?? "").toUpperCase();
  if (!name || state.length !== 2) throw new Error("Name and 2-letter state are required.");

  const sourcesRaw = str("sources") ?? "";
  const sources = sourcesRaw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [url, ...labelParts] = line.split(" ");
      return { url, label: labelParts.join(" ") || undefined, accessedAt: new Date().toISOString().slice(0, 10) };
    });

  const values = {
    slug: str("slug") ?? slugify(name),
    name,
    developer: str("developer"),
    city: str("city"),
    county: str("county"),
    state,
    nearestZip: str("nearestZip"),
    latitude: str("latitude") ? parseFloat(str("latitude")!) : null,
    longitude: str("longitude") ? parseFloat(str("longitude")!) : null,
    status: (str("status") ?? "proposed") as typeof projects.$inferInsert.status,
    statusDetail: str("statusDetail"),
    capacity: str("capacity"),
    investment: str("investment"),
    notes: str("notes"),
    municipalityUrl: str("municipalityUrl"),
    oppositionGroup: str("oppositionGroup"),
    oppositionGroupUrl: str("oppositionGroupUrl"),
    nextHearingDate: str("nextHearingDate"),
    nextHearingDetails: str("nextHearingDetails"),
    sources,
    verificationNote: str("verificationNote"),
    verificationTier: (str("verificationTier") ?? "lead") as "verified" | "corroborated" | "lead",
    // "Mark verified now" stamps today and promotes the tier; otherwise keep the existing stamp.
    ...(formData.get("markVerified")
      ? { verifiedAt: new Date(), verificationTier: "verified" as const }
      : {}),
    published: formData.get("published") === "on",
    updatedAt: new Date(),
  };

  // Guardrail: publishing requires at least one source.
  if (values.published && sources.length === 0) {
    throw new Error("Cannot publish a project with no sources. Add at least one source URL.");
  }

  if (id) {
    await db.update(projects).set(values).where(eq(projects.id, id));
  } else {
    await db.insert(projects).values(values);
  }
  revalidatePath("/admin/projects");
  revalidatePath("/tracker");
  redirect("/admin/projects");
}

export async function deleteProject(formData: FormData) {
  await requireAdmin();
  await db.delete(projects).where(eq(projects.id, Number(formData.get("id"))));
  revalidatePath("/admin/projects");
  revalidatePath("/tracker");
}

// --- Posts ----------------------------------------------------------------

export async function savePost(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") ? Number(formData.get("id")) : null;
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Title required");
  const published = formData.get("published") === "on";
  const values = {
    slug: String(formData.get("slug") || slugify(title)),
    title,
    excerpt: String(formData.get("excerpt") ?? "").trim() || null,
    bodyMd: String(formData.get("bodyMd") ?? ""),
    kind: String(formData.get("kind") ?? "analysis"),
    published,
    publishedAt: published ? new Date() : null,
    updatedAt: new Date(),
  };
  if (id) await db.update(posts).set(values).where(eq(posts.id, id));
  else await db.insert(posts).values(values);
  revalidatePath("/admin/posts");
  revalidatePath("/news");
  redirect("/admin/posts");
}

// --- Products ---------------------------------------------------------------

export async function saveProduct(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  await db
    .update(products)
    .set({
      priceCents: Math.round(parseFloat(String(formData.get("price") ?? "0")) * 100),
      active: formData.get("active") === "on",
      podProductId: String(formData.get("podProductId") ?? "").trim() || null,
    })
    .where(eq(products.id, id));
  revalidatePath("/admin/products");
  revalidatePath("/store");
}

// --- Petitions ----------------------------------------------------------------

export async function savePetition(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") ? Number(formData.get("id")) : null;
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Title required");
  const values = {
    slug: String(formData.get("slug") || slugify(title)),
    title,
    body: String(formData.get("body") ?? ""),
    projectId: formData.get("projectId") ? Number(formData.get("projectId")) : null,
    goal: Number(formData.get("goal") ?? 500),
    active: formData.get("active") === "on",
  };
  if (id) await db.update(petitions).set(values).where(eq(petitions.id, id));
  else await db.insert(petitions).values(values);
  revalidatePath("/admin/petitions");
  revalidatePath("/act");
  redirect("/admin/petitions");
}
