import type { RequestHandler } from "express";

function getBaseUrl(req: any): string {
  const env = process.env.SITE_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "http";
  const host = (req.headers["x-forwarded-host"] as string) || req.get("host");
  return `${proto}://${host}`.replace(/\/$/, "");
}

async function getPublishedPropertySlugs(): Promise<string[]> {
  try {
    const privateKey = process.env.BUILDER_PRIVATE_API_KEY;
    if (privateKey) {
      const url = `https://builder.io/api/v3/content/property?apiKey=${privateKey}&query.data.status=Published&fields=data.slug&limit=200`;
      const r = await fetch(url);
      if (r.ok) {
        const j: any = await r.json();
        const slugs: string[] = (j?.results || [])
          .map((x: any) => x?.data?.slug)
          .filter((s: any) => typeof s === "string" && s.length > 0);
        return Array.from(new Set(slugs));
      }
    }
    // Fallback to in-memory repo
    const { getSeededProperties } = await import("../../shared/repo");
    const all = await getSeededProperties();
    return all.filter((p) => p.status === "Published").map((p) => p.slug);
  } catch {
    return [];
  }
}

export const handleSitemapXml: RequestHandler = async (req, res) => {
  try {
    const base = getBaseUrl(req);
    const staticPaths = ["/", "/search", "/publish"];
    const slugs = await getPublishedPropertySlugs();
    const urls = [
      ...staticPaths.map((p) => `${base}${p}`),
      ...slugs.map((s) => `${base}/property/${encodeURIComponent(s)}`),
    ];

    const now = new Date().toISOString();
    const body = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
      urls.map((loc) => `\n  <url>\n    <loc>${loc}</loc>\n    <changefreq>daily</changefreq>\n    <priority>${loc.endsWith('/') ? '1.0' : '0.8'}</priority>\n    <lastmod>${now}</lastmod>\n  </url>`).join("") +
      `\n</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=UTF-8");
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400"); // 1 day
    res.status(200).send(body);
  } catch (e: any) {
    res.status(500).send("<error>cannot-generate-sitemap</error>");
  }
};

export const handleRobotsTxt: RequestHandler = (req, res) => {
  const base = getBaseUrl(req);
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${base}/sitemap.xml`,
    "",
  ].join("\n");
  res.setHeader("Content-Type", "text/plain; charset=UTF-8");
  res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
  res.status(200).send(body);
};
