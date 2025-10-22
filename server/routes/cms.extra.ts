import type { RequestHandler } from "express";
import { listProperties } from "../../shared/repo";

export const listSeededProperties: RequestHandler = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(String(req.query.pageSize || "20"), 10) || 20));
    const { items, total } = await listProperties({ status: "Published" } as any, page, pageSize);
    res.json({ ok: true, items, total, page, pageSize });
  } catch (e: any) {
    res.status(500).json({ ok: false, message: e?.message || "Error" });
  }
};

export const unpublishProperty: RequestHandler = async (req, res) => {
  try {
    const privateKey = process.env.BUILDER_PRIVATE_API_KEY;
    const isProd = process.env.NODE_ENV === "production";
    const { slug } = (req.body ?? {}) as { slug?: string };
    if (!slug) return res.status(400).json({ error: "Falta slug" });

    if (!privateKey) {
      if (isProd) {
        return res.status(401).json({ ok: false, message: "Falta configuraci��n del servidor (BUILDER_PRIVATE_API_KEY)" });
      } else {
        return res.status(200).json({ ok: false, devHint: true, message: "Falta BUILDER_PRIVATE_API_KEY; ejecutando en modo demo (no se guardó en CMS)." });
      }
    }

    const listUrl = `https://builder.io/api/v3/content/property?apiKey=${privateKey}&query.data.slug=${encodeURIComponent(slug)}`;
    const r = await fetch(listUrl);
    const j = await r.json().catch(() => ({} as any));
    const id = j?.results?.[0]?.id;
    if (!id) return res.status(404).json({ error: "No encontrado" });

    const put = await fetch(`https://builder.io/api/v3/content/${id}?apiKey=${privateKey}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: { status: "Draft" } }),
    });
    if (!put.ok) {
      const detail = await put.text();
      return res.status(500).json({ error: "Builder API error", detail });
    }
    return res.json({ ok: true, id });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Error" });
  }
};

export const deleteProperty: RequestHandler = async (req, res) => {
  try {
    const privateKey = process.env.BUILDER_PRIVATE_API_KEY;
    const isProd = process.env.NODE_ENV === "production";
    const { slug } = (req.body ?? {}) as { slug?: string };
    if (!slug) return res.status(400).json({ error: "Falta slug" });

    if (!privateKey) {
      if (isProd) {
        return res.status(401).json({ ok: false, message: "Falta configuración del servidor (BUILDER_PRIVATE_API_KEY)" });
      } else {
        return res.status(200).json({ ok: false, devHint: true, message: "Falta BUILDER_PRIVATE_API_KEY; ejecutando en modo demo (no se guardó en CMS)." });
      }
    }

    const listUrl = `https://builder.io/api/v3/content/property?apiKey=${privateKey}&query.data.slug=${encodeURIComponent(slug)}`;
    const r = await fetch(listUrl);
    const j = await r.json().catch(() => ({} as any));
    const id = j?.results?.[0]?.id;
    if (!id) return res.status(404).json({ error: "No encontrado" });

    const del = await fetch(`https://builder.io/api/v3/content/${id}?apiKey=${privateKey}`, { method: "DELETE" });
    if (!del.ok) {
      const detail = await del.text();
      return res.status(500).json({ error: "Builder API error", detail });
    }
    return res.json({ ok: true, id });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Error" });
  }
};

function shortId(len = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[(Math.random() * chars.length) | 0];
  return out;
}

export const updateProperty: RequestHandler = async (req, res) => {
  try {
    const privateKey = process.env.BUILDER_PRIVATE_API_KEY;
    const isProd = process.env.NODE_ENV === "production";
    const slug = (req.params as any)?.slug as string | undefined;
    const input = (req.body ?? {}) as any;
    if (!slug) return res.status(400).json({ ok:false, message: "Falta slug" });

    if (!privateKey) {
      if (isProd) {
        return res.status(401).json({ ok: false, message: "Falta configuración del servidor (BUILDER_PRIVATE_API_KEY)" });
      } else {
        return res.status(200).json({ ok: false, devHint: true, message: "Falta BUILDER_PRIVATE_API_KEY; ejecutando en modo demo (no se guardó en CMS)." });
      }
    }

    // fetch existing by slug
    const listUrl = `https://builder.io/api/v3/content/property?apiKey=${privateKey}&query.data.slug=${encodeURIComponent(slug)}`;
    const r = await fetch(listUrl);
    const j = await r.json().catch(() => ({} as any));
    const doc = j?.results?.[0];
    if (!doc) return res.status(404).json({ ok:false, message: "No encontrado" });
    const id = doc.id;
    const existing = doc.data || {};

    // merge
    const next = { ...existing, ...input };

    // If title changed, compute new slug and ensure uniqueness
    let newSlug = slug;
    if (typeof input.title === "string" && input.title.trim() && input.title.trim() !== existing.title) {
      const base = (await import("../../shared/formatters")).slugifyEs(input.title.trim());
      let candidate = `${base}-${shortId(6)}`;
      // ensure unique: check if some other content has this slug
      const checkUrl = `https://builder.io/api/v3/content/property?apiKey=${privateKey}&query.data.slug=${encodeURIComponent(candidate)}`;
      const cr = await fetch(checkUrl);
      const cj = await cr.json().catch(()=>({} as any));
      const exists = Array.isArray(cj?.results) && cj.results.some((it:any)=> it?.id && it.id !== id);
      if (exists) candidate = `${base}-${shortId(6)}`;
      newSlug = candidate;
      next.slug = newSlug;
    }

    // Validate with shared zod schema (partial update acceptable)
    try {
      const { PropertySchema } = await import("../../shared/schemas");
      PropertySchema.partial().parse(next);
    } catch (e:any) {
      return res.status(400).json({ ok:false, message: e?.message || "Datos inválidos" });
    }

    const put = await fetch(`https://builder.io/api/v3/content/${id}?apiKey=${privateKey}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: next }),
    });
    if (!put.ok) {
      const detail = await put.text();
      return res.status(500).json({ ok:false, message: "Builder API error", detail });
    }
    return res.json({ ok:true, slug: newSlug });
  } catch (e:any) {
    return res.status(500).json({ ok:false, message: e?.message || "Error" });
  }
};
