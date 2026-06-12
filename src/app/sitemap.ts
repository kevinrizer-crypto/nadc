import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { PILLAR_ORDER } from "@/lib/content";
import { getPublishedProjects, getPublishedPosts, getActivePetitions } from "@/lib/queries";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    "",
    "/learn",
    "/learn/glossary",
    "/learn/myth-vs-fact",
    "/tracker",
    "/organize",
    "/act",
    "/act/petitions",
    "/act/officials",
    "/store",
    "/news",
    "/about",
    "/donate",
    "/report",
    "/subscribe",
    "/privacy",
    "/consent-policy",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const pillarPages = PILLAR_ORDER.map((p) => ({
    url: `${SITE_URL}/learn/${p.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  const [projects, posts, petitions] = await Promise.all([
    getPublishedProjects().catch(() => []),
    getPublishedPosts().catch(() => []),
    getActivePetitions().catch(() => []),
  ]);

  return [
    ...staticPages,
    ...pillarPages,
    ...projects.map((p) => ({
      url: `${SITE_URL}/tracker/${p.state.toLowerCase()}/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...posts.map((p) => ({
      url: `${SITE_URL}/news/${p.slug}`,
      lastModified: p.publishedAt ?? undefined,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...petitions.map(({ petition }) => ({
      url: `${SITE_URL}/act/petitions/${petition.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
  ];
}
