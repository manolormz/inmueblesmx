import type { RequestHandler } from "express";
import { getIndex, isMeiliConfigured } from "../search/meili";
import fs from "fs";
import path from "path";

function normalize(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function dedupeById<T extends { id: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of arr) {
    if (!seen.has(it.id)) { seen.add(it.id); out.push(it); }
  }
  return out;
}

export const handleLocationsSearch: RequestHandler = async (req, res) => {
  const qRaw = typeof req.query.q === "string" ? req.query.q : "";
  const q = qRaw.trim();
  const type = typeof req.query.type === "string" ? req.query.type : undefined; // "state"|"city"|"neighborhood"|"metro"
  const citySlug = typeof req.query.citySlug === "string" ? req.query.citySlug : undefined;
  const limitRaw = Number(req.query.limit || 12);
  const limit = Math.max(1, Math.min(20, Number.isFinite(limitRaw) ? limitRaw : 12));

  type Loc = { id: string; name: string; slug: string; type: "state"|"city"|"neighborhood"|"metro"; state?: string; city?: string; city_slug?: string; parent_slug?: string; lat?: number|null; lng?: number|null; popularity?: number };

  async function meiliGrouped(): Promise<{cities: Loc[]; states: Loc[]; neighborhoods: Loc[]}> {
    const index = getIndex();

    // 1) Curated when short/empty query
    if (!q || q.length < 2) {
      const [cRes, sRes] = await Promise.all([
        index.search("", { filter: 'type = "city"', sort: ["popularity:desc", "name:asc"], limit: 8 }),
        index.search("", { filter: 'type = "state"', sort: ["popularity:desc", "name:asc"], limit: 6 }),
      ]);
      const cities = (cRes.hits || []).map((h: any) => toLoc(h));
      const states = (sRes.hits || []).map((h: any) => toLoc(h));
      return { cities, states, neighborhoods: [] };
    }

    // 2) Query >= 2
    if (type) {
      const filters: string[] = [`type = ${JSON.stringify(type)}`];
      if (type === "neighborhood" && citySlug) filters.push(`city_slug = ${JSON.stringify(citySlug)}`);
      const resp = await index.search(q, { filter: filters.join(" AND "), limit, sort: ["popularity:desc", "name:asc"] });
      const arr = (resp.hits || []).map((h: any) => toLoc(h));
      return {
        cities: type === "city" ? arr : [],
        states: type === "state" ? arr : [],
        neighborhoods: type === "neighborhood" ? arr : [],
      };
    }

    // cities + states first
    const resp = await index.search(q, { filter: 'type IN ["city", "state"]', limit: 15, sort: ["popularity:desc", "name:asc"] });
    const hits = (resp.hits || []).map((h: any) => toLoc(h));
    let cities = hits.filter((h) => h.type === "city");
    let states = hits.filter((h) => h.type === "state");
    let neighborhoods: Loc[] = [];

    if (hits.length < 10) {
      const nRes = await index.search(q, { filter: 'type = "neighborhood"', limit: 10, sort: ["popularity:desc", "name:asc"] });
      neighborhoods = (nRes.hits || []).map((h: any) => toLoc(h));
    }

    cities = dedupeById(cities);
    states = dedupeById(states);
    neighborhoods = dedupeById(neighborhoods);
    return { cities, states, neighborhoods };
  }

  function toLoc(h: any): Loc {
    return {
      id: h.id,
      name: h.name,
      slug: h.slug,
      type: h.type,
      state: h.state,
      city: h.city,
      city_slug: h.city_slug,
      parent_slug: h.parent_slug,
      lat: typeof h.lat === "number" ? h.lat : null,
      lng: typeof h.lng === "number" ? h.lng : null,
      popularity: typeof h.popularity === "number" ? h.popularity : undefined,
    };
  }

  function localGrouped(): {cities: Loc[]; states: Loc[]; neighborhoods: Loc[]} {
    const full = path.resolve("shared/data/locations.mx.json");
    let raw: any[] = [];
    try {
      const txt = fs.readFileSync(full, "utf8");
      raw = JSON.parse(txt);
    } catch {
      return { cities: [], states: [], neighborhoods: [] };
    }
    const all: Loc[] = raw.map((h: any) => toLoc(h));
    const n = normalize(q);

    const byType = (t: string) => all.filter((x) => x.type === t);
    const sortPop = (arr: Loc[]) => arr.sort((a, b) => (b.popularity || 0) - (a.popularity || 0) || String(a.name).localeCompare(String(b.name)));
    const match = (x: Loc) => {
      if (!n) return true;
      const name = normalize(x.name || "");
      const keys = normalize(String((raw.find((r) => r.id === x.id)?.search_keywords) || ""));
      return name.startsWith(n) || name.includes(n) || (keys ? keys.includes(n) : false);
    };

    if (!q || q.length < 2) {
      const cities = sortPop(byType("city").filter(match)).slice(0, 8);
      const states = sortPop(byType("state").filter(match)).slice(0, 4);
      return { cities, states, neighborhoods: [] };
    }

    if (type) {
      let pool = byType(type).filter(match);
      if (type === "neighborhood" && citySlug) pool = pool.filter((x) => x.city_slug === citySlug);
      pool = sortPop(pool).slice(0, limit);
      return {
        cities: type === "city" ? pool : [],
        states: type === "state" ? pool : [],
        neighborhoods: type === "neighborhood" ? pool : [],
      };
    }

    let cities = sortPop(byType("city").filter(match));
    let states = sortPop(byType("state").filter(match));
    const topCombined = [...cities, ...states].slice(0, 15);
    cities = topCombined.filter((x) => x.type === "city");
    states = topCombined.filter((x) => x.type === "state");

    let neighborhoods: Loc[] = [];
    if (topCombined.length < 10) {
      neighborhoods = sortPop(byType("neighborhood").filter(match)).slice(0, 10);
    }
    return { cities, states, neighborhoods };
  }

  try {
    if (!isMeiliConfigured()) {
      const items = localGrouped();
      return res.status(200).json({ ok: true, items });
    }
    const items = await meiliGrouped();
    return res.status(200).json({ ok: true, items });
  } catch (err: any) {
    const msg = (err && (err.message || err.msg)) || "Error de búsqueda";
    return res.status(500).json({ ok: false, message: msg });
  }
};
