import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "GPTBot",
        allow: ["/", "/api/contents/", "/api/ai-index.json", "/llms.txt"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: ["/", "/api/contents/", "/api/ai-index.json", "/llms.txt"],
      },
      {
        userAgent: "ClaudeBot",
        allow: ["/", "/api/contents/", "/api/ai-index.json", "/llms.txt"],
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/", "/api/contents/", "/api/ai-index.json", "/llms.txt"],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/api/contents/", "/api/ai-index.json", "/llms.txt"],
      },
      {
        userAgent: "*",
        disallow: ["/admin/", "/api/admin/", "/api/events"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
