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
