import type { RequestHandler } from "express";

function normalize(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export const handleLocationsSearch: RequestHandler = async (req, res) => {
  const qRaw = String(req.query.q || "");
  const type = typeof req.query.type === "string" ? req.query.type : undefined;
  const limitRaw = Number(req.query.limit || 8);
  const limit = Math.max(1, Math.min(20, Number.isFinite(limitRaw) ? limitRaw : 8));

  if (!qRaw || qRaw.trim().length < 1) {
    return res.status(400).json({ ok: false, message: "Parámetro 'q' es requerido" });
  }

  const hasKey = !!process.env.BUILDER_PRIVATE_API_KEY;
  if (!hasKey) {
    if (process.env.NODE_ENV === "production") {
      return res.status(401).json({ ok: false, message: "Falta configuración del servidor (BUILDER_PRIVATE_API_KEY)" });
    }
    // Dev hint: let client use local seeds
    return res.status(200).json({ ok: false, devHint: true, items: [] });
  }

  // If we had a real CMS, we'd query it here. Placeholder: return empty with ok true to keep contract.
  const q = normalize(qRaw);
  const items: any[] = [];
  // TODO: Replace with real CMS query using BUILDER_PRIVATE_API_KEY when available.

  // sort & slice
  items.sort((a, b) => (b.popularity || 0) - (a.popularity || 0) || String(a.name).localeCompare(String(b.name)));
  return res.json({ ok: true, items: items.slice(0, limit).map(({ id, name, slug, type, lat, lng }) => ({ id, name, slug, type, lat, lng })) });
};
