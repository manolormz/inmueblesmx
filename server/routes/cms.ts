import type { RequestHandler } from "express";
import { PropertySchema } from "@shared/schemas";
import { slugifyEs } from "@shared/formatters";

function shortId(len = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[(Math.random() * chars.length) | 0];
  return out;
}

export const createProperty: RequestHandler = async (req, res) => {
  try {
    const privateKey = process.env.BUILDER_PRIVATE_API_KEY;
    if (!privateKey) {
      return res.status(500).json({ error: "Missing BUILDER_PRIVATE_API_KEY" });
    }

    const input = req.body ?? {};
    const slug = input.slug || `${slugifyEs(input.title || "propiedad")}-${shortId(6)}`;

    const parsed = PropertySchema.parse({
      ...input,
      slug,
      status: input.status ?? "Draft",
      is_featured: input.is_featured ?? false,
      views: input.views ?? 0,
    });

    const resp = await fetch(`https://builder.io/api/v3/content/property?apiKey=${privateKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: parsed.title,
        published: "draft",
        data: parsed,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(500).json({ error: "Builder API error", detail: text });
    }

    const json = await resp.json();
    return res.json(json);
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || "Invalid payload" });
  }
};

export const publishProperty: RequestHandler = async (req, res) => {
  try {
    const privateKey = process.env.BUILDER_PRIVATE_API_KEY;
    const { slug } = (req.body ?? {}) as { slug?: string };
    if (!slug) return res.status(400).json({ error: "Falta slug" });

    if (privateKey) {
      // Try to find content by slug
      const listUrl = `https://builder.io/api/v3/content/property?apiKey=${privateKey}&query.data.slug=${encodeURIComponent(slug)}`;
      const r = await fetch(listUrl);
      const j = await r.json().catch(() => ({} as any));
      const id = j?.results?.[0]?.id;
      if (id) {
        const put = await fetch(`https://builder.io/api/v3/content/${id}?apiKey=${privateKey}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: { status: "Published" } }),
        });
        if (!put.ok) {
          const detail = await put.text();
          return res.status(500).json({ error: "Builder API error", detail });
        }
        return res.json({ ok: true, id });
      }
    }

    // Fallback to in-memory
    const { updatePropertyStatus } = await import("@shared/repo");
    const updated = await updatePropertyStatus(slug, "Published" as any);
    if (!updated) return res.status(404).json({ error: "No encontrado" });
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Error" });
  }
};
