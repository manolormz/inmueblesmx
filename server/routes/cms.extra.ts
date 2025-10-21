import type { RequestHandler } from "express";

export const unpublishProperty: RequestHandler = async (req, res) => {
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
