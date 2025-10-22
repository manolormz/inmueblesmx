#!/usr/bin/env tsx
import fs from "fs";
import path from "path";
import { slugifyEs } from "../../shared/formatters";

interface SepomexRow {
  d_asenta?: string; // colonia
  d_mnpio?: string; // municipio/ciudad
  D_mnpio?: string;
  d_estado?: string; // estado
  d_codigo?: string; // CP
  lat?: number | null;
  lng?: number | null;
}

interface CityGazette {
  name: string;
  state?: string;
  population?: number;
  lat?: number | null;
  lng?: number | null;
}

function parseArgs(argv: string[]) {
  const out: Record<string, string> = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const [k, v] = a.replace(/^--/, "").split("=");
      out[k] = v ?? "";
    }
  }
  return out;
}

function readJsonOrCsv(file: string): SepomexRow[] {
  const raw = fs.readFileSync(file, "utf8");
  if (/\.json$/i.test(file)) {
    const val = JSON.parse(raw);
    if (Array.isArray(val)) return val as SepomexRow[];
    throw new Error("El JSON de entrada no es un array");
  }
  // CSV simple con encabezados
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const header = lines[0].split(",");
  const rows: SepomexRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const obj: any = {};
    header.forEach((h, idx) => { obj[h.trim()] = (cols[idx] ?? "").trim(); });
    rows.push(obj);
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = ""; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i+1] === '"') { cur += '"'; i++; }
      else { inQ = !inQ; }
    } else if (ch === "," && !inQ) {
      out.push(cur); cur = "";
    } else { cur += ch; }
  }
  out.push(cur);
  return out;
}

function popularityForCity(pop?: number): number {
  if (!pop || pop <= 0) return 55;
  if (pop >= 500_000) return 90 + Math.min(10, Math.floor((pop - 500_000) / 1_000_000));
  if (pop >= 100_000) return 60 + Math.min(24, Math.floor((pop - 100_000) / 17_500));
  return 45 + Math.min(14, Math.floor(pop / 10_000));
}

function main() {
  const args = parseArgs(process.argv);
  const input = args.input || args.i;
  const citiesFile = args.cities || args.gazetteer;
  const outFile = args.out || args.o;
  if (!input) {
    console.error("Uso: tsx scripts/ingest/sepomex_to_json.ts --input=sepomex.csv [--cities=cities.json] [--out=locations.json]");
    process.exit(1);
  }

  const rows = readJsonOrCsv(path.resolve(input));
  const gaz: CityGazette[] = citiesFile ? JSON.parse(fs.readFileSync(path.resolve(citiesFile), "utf8")) : [];
  const cityInfo = new Map<string, CityGazette>();
  for (const c of gaz) {
    const key = `${(c.state||"").toLowerCase()}|${c.name.toLowerCase()}`;
    cityInfo.set(key, c);
  }

  const states = new Map<string, any>();
  const cities = new Map<string, any>();
  const neighborhoods = new Map<string, any>();

  for (const r of rows) {
    const rawCol = (r.d_asenta || "").trim();
    const rawCity = (r.d_mnpio || r.D_mnpio || "").trim();
    const rawState = (r.d_estado || "").trim();
    if (!rawCity || !rawState) continue;

    // states
    if (!states.has(rawState)) {
      const stSlug = slugifyEs(rawState);
      states.set(rawState, {
        id: `st-${stSlug}`,
        name: rawState,
        slug: stSlug,
        type: "state",
        state: rawState,
        city: "",
        city_slug: "",
        parent_slug: "",
        lat: null,
        lng: null,
        popularity: 80,
        search_keywords: [],
        postal_codes: [],
      });
    }

    // cities
    const citySlug = slugifyEs(rawCity);
    const stSlug = slugifyEs(rawState);
    const ckey = `${rawState}|${rawCity}`;
    if (!cities.has(ckey)) {
      const info = cityInfo.get(`${rawState.toLowerCase()}|${rawCity.toLowerCase()}`);
      cities.set(ckey, {
        id: citySlug,
        name: rawCity,
        slug: citySlug,
        type: "city",
        state: rawState,
        city: rawCity,
        city_slug: citySlug,
        parent_slug: stSlug,
        lat: info?.lat ?? null,
        lng: info?.lng ?? null,
        popularity: popularityForCity(info?.population),
        search_keywords: [],
        postal_codes: [],
      });
    }

    // neighborhoods/colonias
    const col = rawCol;
    if (col) {
      const nSlug = slugifyEs(col);
      const key = `${ckey}|${nSlug}`;
      const pc = (r.d_codigo || "").trim();
      const prev = neighborhoods.get(key);
      if (!prev) {
        neighborhoods.set(key, {
          id: `${citySlug}-${nSlug}`,
          name: col,
          slug: nSlug,
          type: "neighborhood",
          state: rawState,
          city: rawCity,
          city_slug: citySlug,
          parent_slug: citySlug,
          lat: r.lat ?? null,
          lng: r.lng ?? null,
          popularity: 40,
          search_keywords: [],
          postal_codes: pc ? [pc] : [],
        });
      } else if (pc) {
        const set = new Set([...(prev.postal_codes || []), pc]);
        prev.postal_codes = Array.from(set);
        neighborhoods.set(key, prev);
      }
    }
  }

  // Heurística de popularidad para estados y colonias
  for (const v of states.values()) {
    v.popularity = 75 + Math.floor(Math.random() * 10);
  }
  for (const v of neighborhoods.values()) {
    if (v.city_slug && /ciudad-de-mexico|guadalajara|monterrey/.test(v.city_slug)) v.popularity = 55 + Math.floor(Math.random() * 25);
    else v.popularity = 30 + Math.floor(Math.random() * 20);
  }

  const out = [
    ...Array.from(states.values()),
    ...Array.from(cities.values()),
    ...Array.from(neighborhoods.values()),
  ];

  if (outFile) fs.writeFileSync(path.resolve(outFile), JSON.stringify(out, null, 2));
  else process.stdout.write(JSON.stringify(out, null, 2));
}

main();
