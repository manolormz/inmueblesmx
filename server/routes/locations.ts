import type { RequestHandler } from "express";
import { getIndex, isMeiliConfigured } from "../search/meili";

function normalize(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export const handleLocationsSearch: RequestHandler = async (req, res) => {
  const qRaw = typeof req.query.q === "string" ? req.query.q : "";
  const q = qRaw.trim();
  const type = typeof req.query.type === "string" ? req.query.type : undefined; // "state"|"city"|"neighborhood"|"metro"
  const citySlug = typeof req.query.citySlug === "string" ? req.query.citySlug : undefined;
  const limitRaw = Number(req.query.limit || 10);
  const limit = Math.max(1, Math.min(20, Number.isFinite(limitRaw) ? limitRaw : 10));

  if (!isMeiliConfigured()) {
    // Sin Meili configurado, el cliente debe usar el fallback local
    return res.status(200).json({ ok: false, devHint: true, items: [] });
  }

  try {
    const index = getIndex();

    // Construir filtros
    const filters: string[] = [];
    const allowedTypes: string[] = [];
    if (!q || q.length < 2) {
      // Solo estados y ciudades cuando no hay consulta o es corta
      allowedTypes.push("state", "city");
    } else {
      // Incluir colonias con consultas más largas
      allowedTypes.push("state", "city", "neighborhood");
    }
    if (type && ["state","city","neighborhood","metro"].includes(type)) {
      // restringir aún más si el usuario pide un tipo específico
      filters.push(`type = ${JSON.stringify(type)}`);
    } else if (allowedTypes.length) {
      const inList = allowedTypes.map(t => JSON.stringify(t)).join(", ");
      filters.push(`type IN [${inList}]`);
    }
    if (citySlug) {
      filters.push(`city_slug = ${JSON.stringify(citySlug)}`);
    }

    // Cuando q está vacío/corto, usar sort por popularidad y nombre
    const opts: any = {
      filter: filters.length ? filters.join(" AND ") : undefined,
      limit,
    };
    if (!q || q.length < 2) {
      opts.sort = ["popularity:desc", "name:asc"];
    }

    const resp = await index.search(q, opts);
    const items = (resp.hits || []).map((h: any) => ({
      id: h.id,
      name: h.name,
      slug: h.slug,
      type: h.type,
      state: h.state,
      city: h.city,
      city_slug: h.city_slug,
      parent_slug: h.parent_slug,
      lat: typeof h.lat === "number" ? h.lat : undefined,
      lng: typeof h.lng === "number" ? h.lng : undefined,
    }));

    return res.status(200).json({ ok: true, items });
  } catch (err: any) {
    const msg = (err && (err.message || err.msg)) || "Error de búsqueda";
    return res.status(500).json({ ok: false, message: msg });
  }
};
