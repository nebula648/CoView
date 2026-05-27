import type { MetadataRoute } from "next";
import { getAllContents } from "@/lib/repository";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const contents = await getAllContents();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/discover`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/dashboard`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.8 },
  ];

  const contentRoutes: MetadataRoute.Sitemap = contents.map((c: any) => ({
    url: `${baseUrl}/content/${c.id}`,
    lastModified: new Date(c.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const aiJsonRoutes: MetadataRoute.Sitemap = contents
    .filter((c: any) => c.allow_ai_view ?? true)
    .map((c: any) => ({
      url: `${baseUrl}/api/contents/${c.id}.json`,
      lastModified: new Date(c.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));

  return [...staticRoutes, ...contentRoutes, ...aiJsonRoutes];
}
