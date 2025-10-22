#!/usr/bin/env tsx
import fs from "fs";
import path from "path";
import { MeiliSearch } from "meilisearch";
import { getClient, isMeiliConfigured, MEILI_INDEX_LOCATIONS } from "../../server/search/meili";

// Uso: npx tsx scripts/ingest/sync_to_meili.ts [--file shared/data/locations.mx.json] [--prune] [--dry-run] [--env staging]

type Loc = {
  id: string;
  name: string;
  slug: string;
  type: "state" | "city" | "neighborhood" | "metro";
  state?: string;
  city?: string;
  city_slug?: string;
  parent_slug?: string;
  lat?: number | null;
  lng?: number | null;
  popularity?: number;
  search_keywords?: string[] | string;
  postal_codes?: string[];
  updated_at?: string;
  [k: string]: any;
};

const KEYS: (keyof Loc)[] = [
  "id","name","slug","type","state","city","city_slug","parent_slug","lat","lng","popularity","search_keywords","postal_codes",
];

function parseArgs(argv: string[]) {
  const out: Record<string, string | boolean> = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--prune") out.prune = true;
    else if (a === "--dry-run") out["dry-run"] = true;
    else if (a.startsWith("--")) {
      const [k, v] = a.replace(/^--/, "").split("=");
      out[k] = v ?? true;
    }
  }
  return out;
}

function stableNormalize(doc: any): Loc {
  const d: any = {};
  for (const k of KEYS) {
    if (k in doc && doc[k] !== undefined) d[k] = doc[k];
  }
  // normalizar arrays y tipos
  if (typeof d.search_keywords === "string") d.search_keywords = String(d.search_keywords).split(/\s*,\s*/).filter(Boolean);
  if (Array.isArray(d.search_keywords)) d.search_keywords = [...d.search_keywords].map(String).sort();
  if (Array.isArray(d.postal_codes)) d.postal_codes = [...d.postal_codes].map(String).sort();
  if (d.lat === undefined) d.lat = null;
  if (d.lng === undefined) d.lng = null;
  return d as Loc;
}

function hashLoc(doc: Loc): string {
  const clone: any = { ...doc };
  delete clone.updated_at;
  // ordenar claves para estabilidad
  const ordered: any = {};
  for (const k of KEYS) {
    if (clone[k] !== undefined) ordered[k] = clone[k];
  }
  return JSON.stringify(ordered);
}

async function ensureIndexForName(client: MeiliSearch, name: string) {
  try {
    await client.getIndex(name);
  } catch {
    await client.createIndex(name, { primaryKey: "id" });
  }
  const idx = client.index(name);
  await idx.updateSettings({
    searchableAttributes: [
      "name",
      "search_keywords",
      "city",
      "municipality",
      "state",
      "postal_codes",
    ],
    filterableAttributes: [
      "type",
      "state",
      "state_slug",
      "city",
      "city_slug",
      "municipality",
      "municipality_slug",
      "parent_slug",
    ],
    sortableAttributes: ["popularity", "name"],
    rankingRules: ["typo", "words", "proximity", "attribute", "exactness", "sort"],
    synonyms: {
      cdmx: ["df", "ciudad de mexico", "d.f.", "mexico, d.f."],
      slp: ["san luis potosi", "san luis p."],
      qro: ["queretaro", "querétaro"],
      gdl: ["guadalajara", "zmg"],
      gto: ["guanajuato"],
      edomex: ["estado de mexico", "edoméx", "e do mex"],
      culiacan: ["culiacán", "culiacan sinaloa"],
    },
    typoTolerance: { enabled: true, minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 } as any } as any,
  } as any);
  return idx;
}

async function fetchAllDocs(index: any, fields: string[]): Promise<Loc[]> {
  const limit = 1000;
  let offset = 0;
  const out: Loc[] = [];
  // getDocuments paginado
  while (true) {
    const page = await index.getDocuments({ limit, offset, fields });
    const hits: any[] = (page?.results || page) as any[]; // compatibilidad con SDKs
    if (!hits || hits.length === 0) break;
    for (const h of hits) out.push(h as Loc);
    offset += hits.length;
    if (hits.length < limit) break;
  }
  return out;
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3, baseMs = 1000, maxMs = 10000): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (e: any) {
      const status = e?.code || e?.status || e?.response?.status;
      if ((status === 429 || status === 503) && attempt < retries) {
        const wait = Math.min(maxMs, baseMs * Math.pow(2, attempt));
        await new Promise((r) => setTimeout(r, wait));
        attempt++;
        continue;
      }
      throw e;
    }
  }
}

async function main() {
  const start = Date.now();
  if (!isMeiliConfigured()) {
    console.error("❌ Meilisearch no está configurado. Define MEILI_HOST y MEILI_API_KEY.");
    process.exit(1);
  }
  const args = parseArgs(process.argv);
  const fileArg = (args.file as string) || (args.f as string) || "shared/data/locations.mx.json";
  const dryRun = Boolean(args["dry-run"]);
  const prune = Boolean(args.prune);
  const envSuffix = (args.env as string) || "";

  const baseName = MEILI_INDEX_LOCATIONS;
  const indexName = envSuffix ? `${baseName}_${envSuffix}` : baseName;

  const full = path.resolve(fileArg);
  if (!fs.existsSync(full)) {
    console.error(`❌ No existe el archivo local: ${full}`);
    process.exit(1);
  }
  const localRaw = JSON.parse(fs.readFileSync(full, "utf8"));
  if (!Array.isArray(localRaw)) {
    console.error("❌ El archivo local debe ser un array JSON");
    process.exit(1);
  }

  const local: Loc[] = localRaw.map(stableNormalize);
  const client = getClient();
  const index = await ensureIndexForName(client as any, indexName);

  // Cargar remoto (solo campos necesarios + updated_at)
  const remoteDocs = await fetchAllDocs(index, [...KEYS, "updated_at"] as string[]);

  const remoteMap = new Map<string, Loc>();
  const remoteHash = new Map<string, string>();
  for (const r of remoteDocs) {
    const n = stableNormalize(r);
    remoteMap.set(n.id, n);
    remoteHash.set(n.id, hashLoc(n));
  }

  const localMap = new Map<string, Loc>();
  const localHash = new Map<string, string>();
  for (const d of local) {
    localMap.set(d.id, d);
    localHash.set(d.id, hashLoc(d));
  }

  const toAdd: Loc[] = [];
  const toUpdate: Loc[] = [];
  for (const [id, d] of localMap.entries()) {
    if (!remoteMap.has(id)) toAdd.push(d);
    else if (localHash.get(id) !== remoteHash.get(id)) toUpdate.push(d);
  }

  const toDelete: string[] = [];
  if (prune) {
    for (const id of remoteMap.keys()) {
      if (!localMap.has(id)) toDelete.push(id);
    }
  }

  const skipped = local.length - toAdd.length - toUpdate.length;

  console.log(`⚙️  MeiliSync (${indexName})`);
  console.log(`Comparando ${local.length.toLocaleString("es-MX")} locales vs ${remoteMap.size.toLocaleString("es-MX")} remotos…`);
  console.log(`➕  Agregados: ${toAdd.length.toLocaleString("es-MX")}`);
  console.log(`🔄  Actualizados: ${toUpdate.length.toLocaleString("es-MX")}`);
  console.log(`❌  Eliminados: ${toDelete.length.toLocaleString("es-MX")}`);
  console.log(`⏭️  Omitidos: ${skipped.toLocaleString("es-MX")}`);

  if (dryRun) {
    console.log("🧪 Modo simulación (dry-run): no se aplicaron cambios.");
    const secs = (Date.now() - start) / 1000;
    console.log(`✅ Sincronización simulada en ${secs.toFixed(1)}s`);
    return;
  }

  // Añadir/actualizar
  const nowIso = new Date().toISOString();
  const upserts = [...toAdd, ...toUpdate].map((d) => ({ ...d, updated_at: nowIso }));
  const chunkSize = 5000;
  for (let i = 0; i < upserts.length; i += chunkSize) {
    const chunk = upserts.slice(i, i + chunkSize);
    const task = await withRetry(() => index.updateDocuments(chunk, { primaryKey: "id" }));
    await client.waitForTask(task.taskUid);
    console.log(`📦 Subidos ${Math.min(i + chunkSize, upserts.length)}/${upserts.length}`);
  }

  // Eliminar (opcional)
  if (toDelete.length) {
    for (let i = 0; i < toDelete.length; i += chunkSize) {
      const chunk = toDelete.slice(i, i + chunkSize);
      const task = await withRetry(() => index.deleteDocuments(chunk));
      await client.waitForTask(task.taskUid);
      console.log(`🗑️  Eliminados ${Math.min(i + chunkSize, toDelete.length)}/${toDelete.length}`);
    }
  }

  const secs = (Date.now() - start) / 1000;
  console.log(`✅ Sincronización completada en ${secs.toFixed(1)}s`);
  console.log(`Agregados: ${toAdd.length} | Actualizados: ${toUpdate.length} | Eliminados: ${toDelete.length} | Omitidos: ${skipped}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
