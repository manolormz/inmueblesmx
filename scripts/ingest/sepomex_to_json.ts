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
  if (!pop || pop <= 0) return 60;
  if (pop >= 500_000) return 90 + Math.min(10, Math.floor((pop - 500_000) / 1_000_000));
  if (pop >= 100_000) return 60 + Math.min(24, Math.floor((pop - 100_000) / 17_500));
  return 50 + Math.min(10, Math.floor(pop / 10_000));
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
  const municipalities = new Map<string, any>();
  const cities = new Map<string, any>();
  const neighborhoods = new Map<string, any>();

  for (const r of rows) {
    const rawCol = (r.d_asenta || "").trim();
    const rawCity = (r.d_mnpio || r.D_mnpio || "").trim();
    const rawState = (r.d_estado || "").trim();
    if (!rawCity || !rawState) continue;

    // states
    const stSlug = slugifyEs(rawState);
    if (!states.has(rawState)) {
      const noAcc = rawState.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
      const kws: string[] = [];
      if (/^ciudad de mexico|cdmx|d\.?f\.?$/i.test(noAcc)) kws.push("cdmx", "ciudad de mexico", "df", "d.f.");
      if (/^estado de mexico|edomex/i.test(noAcc)) kws.push("estado de mexico", "edomex", "edoméx", "e do mex");
      states.set(rawState, {
        id: `st-${stSlug}`,
        name: rawState,
        slug: stSlug,
        type: "state",
        state: rawState,
        state_slug: stSlug,
        city: "",
        city_slug: "",
        parent_slug: "",
        lat: null,
        lng: null,
        popularity: 80,
        search_keywords: kws,
        postal_codes: [],
      });
    }

    // municipalities
    const munName = rawCity;
    const munSlug = slugifyEs(munName);
    const mkey = `${rawState}|${munName}`;
    if (!municipalities.has(mkey)) {
      const noAccMun = munName.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
      const kws = ["mun.", "mpio", noAccMun];
      if (/^san luis potosi/i.test(noAccMun)) kws.push("slp", "san luis p.", "s l potosi");
      if (/^culiacan/i.test(noAccMun)) kws.push("culiacan", "culiacan sinaloa", "culiacán");
      if (/^queretaro/i.test(noAccMun) || /^querétaro/i.test(munName)) kws.push("queretaro", "querétaro", "qro");
      municipalities.set(mkey, {
        id: `mun-${stSlug}-${munSlug}`,
        name: munName,
        slug: munSlug,
        type: "municipality",
        state: rawState,
        state_slug: stSlug,
        municipality: munName,
        municipality_slug: munSlug,
        city: "",
        city_slug: "",
        parent_slug: stSlug,
        lat: null,
        lng: null,
        popularity: 65,
        search_keywords: kws,
        postal_codes: [],
      });
    }

    // cities (use municipio name as seat fallback)
    const citySlug = slugifyEs(munName);
    const ckey = `${rawState}|${munName}`;
    if (!cities.has(ckey)) {
      const info = cityInfo.get(`${rawState.toLowerCase()}|${munName.toLowerCase()}`);
      cities.set(ckey, {
        id: citySlug,
        name: munName,
        slug: citySlug,
        type: "city",
        state: rawState,
        state_slug: stSlug,
        municipality: munName,
        municipality_slug: munSlug,
        city: munName,
        city_slug: citySlug,
        parent_slug: munSlug,
        lat: info?.lat ?? null,
        lng: info?.lng ?? null,
        popularity: Math.max(60, popularityForCity(info?.population)),
        search_keywords: [munName.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")],
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
          state_slug: stSlug,
          municipality: munName,
          municipality_slug: munSlug,
          city: munName,
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
    v.popularity = 70 + Math.floor(Math.random() * 16); // 70–85
  }
  for (const v of neighborhoods.values()) {
    if (v.city_slug && /ciudad-de-mexico|guadalajara|monterrey/.test(v.city_slug)) v.popularity = 55 + Math.floor(Math.random() * 25);
    else v.popularity = 30 + Math.floor(Math.random() * 20);
  }

  const out = [
    ...Array.from(states.values()),
    ...Array.from(municipalities.values()),
    ...Array.from(cities.values()),
    ...Array.from(neighborhoods.values()),
  ];

  if (outFile) fs.writeFileSync(path.resolve(outFile), JSON.stringify(out, null, 2));
  else process.stdout.write(JSON.stringify(out, null, 2));
}

main();
