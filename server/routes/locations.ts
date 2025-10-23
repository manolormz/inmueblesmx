import type { RequestHandler } from "express";
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
    if (!seen.has(it.id)) {
      seen.add(it.id);
      out.push(it);
    }
  }
  return out;
}

export const handleLocationsSearch: RequestHandler = async (req, res) => {
  const qRaw = typeof req.query.q === "string" ? req.query.q : "";
  const q = qRaw.trim();
  const type = typeof req.query.type === "string" ? req.query.type : undefined; // "state"|"municipality"|"city"|"neighborhood"|"metro"
  const stateSlug =
    typeof req.query.stateSlug === "string" ? req.query.stateSlug : undefined;
  const citySlug =
    typeof req.query.citySlug === "string" ? req.query.citySlug : undefined;
  const limitRaw = Number(req.query.limit || 15);
  const limit = Math.max(
    1,
    Math.min(25, Number.isFinite(limitRaw) ? limitRaw : 15),
  );

  type Loc = {
    id: string;
    name: string;
    slug: string;
    type: "state" | "municipality" | "city" | "neighborhood" | "metro";
    state?: string;
    state_slug?: string;
    municipality?: string;
    municipality_slug?: string;
    city?: string;
    city_slug?: string;
    parent_slug?: string;
    lat?: number | null;
    lng?: number | null;
    popularity?: number;
  };


  function toLoc(h: any): Loc {
    return {
      id: h.id,
      name: h.name,
      slug: h.slug,
      type: h.type,
      state: h.state,
      state_slug: h.state_slug,
      municipality: h.municipality,
      municipality_slug: h.municipality_slug,
      city: h.city,
      city_slug: h.city_slug,
      parent_slug: h.parent_slug,
      lat: typeof h.lat === "number" ? h.lat : null,
      lng: typeof h.lng === "number" ? h.lng : null,
      popularity: typeof h.popularity === "number" ? h.popularity : undefined,
    };
  }

  function localGrouped(): {
    states: Loc[];
    municipalities: Loc[];
    cities: Loc[];
    neighborhoods: Loc[];
  } {
    const full = path.resolve("shared/data/municipalities.mx.json");
    let raw: any[] = [];
    try {
      const txt = fs.readFileSync(full, "utf8");
      raw = JSON.parse(txt);
    } catch {
      return { states: [], municipalities: [], cities: [], neighborhoods: [] };
    }
    const all: Loc[] = raw.map((h: any) => toLoc(h));
    const n = normalize(q);

    const byType = (t: string) => all.filter((x) => x.type === t);
    const sortPop = (arr: Loc[]) =>
      arr.sort(
        (a, b) =>
          (b.popularity || 0) - (a.popularity || 0) ||
          String(a.name).localeCompare(String(b.name)),
      );
    const match = (x: Loc) => {
      if (!n) return true;
      const name = normalize(x.name || "");
      const keys = normalize(
        String(raw.find((r) => r.id === x.id)?.search_keywords || ""),
      );
      return (
        name.startsWith(n) ||
        name.includes(n) ||
        (keys ? keys.includes(n) : false)
      );
    };

    if (!q || q.length < 2) {
      const states = sortPop(byType("state").filter(match)).slice(0, 8);
      const municipalities = sortPop(
        byType("municipality").filter(match),
      ).slice(0, 8);
      const cities = sortPop(byType("city").filter(match)).slice(0, 8);
      return { states, municipalities, cities, neighborhoods: [] };
    }

    if (type) {
      let pool = byType(type).filter(match);
      if (type === "neighborhood" && citySlug)
        pool = pool.filter((x) => x.city_slug === citySlug);
      if (stateSlug) pool = pool.filter((x) => x.state_slug === stateSlug);
      pool = sortPop(pool).slice(0, limit);
      return {
        states: type === "state" ? pool : [],
        municipalities: type === "municipality" ? pool : [],
        cities: type === "city" ? pool : [],
        neighborhoods: type === "neighborhood" ? pool : [],
      };
    }

    let states = sortPop(byType("state").filter(match));
    let municipalities = sortPop(byType("municipality").filter(match));
    let cities = sortPop(byType("city").filter(match));
    const topCombined = [...states, ...municipalities, ...cities].slice(0, 20);
    states = topCombined.filter((x) => x.type === "state");
    municipalities = topCombined.filter((x) => x.type === "municipality");
    cities = topCombined.filter((x) => x.type === "city");

    let neighborhoods: Loc[] = [];
    if (topCombined.length < 12 && q.length >= 3) {
      neighborhoods = sortPop(byType("neighborhood").filter(match)).slice(0, 8);
    }
    return { states, municipalities, cities, neighborhoods };
  }

  try {
    const items = localGrouped();
    return res.status(200).json({ ok: true, items });
  } catch (err: any) {
    const msg = (err && (err.message || err.msg)) || "Error de búsqueda";
    return res.status(500).json({ ok: false, message: msg });
  }
};
