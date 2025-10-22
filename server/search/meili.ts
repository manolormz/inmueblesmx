import MeiliSearch from "meilisearch";

const MEILI_HOST = process.env.MEILI_HOST || "";
const MEILI_API_KEY = process.env.MEILI_API_KEY || "";
export const MEILI_INDEX_LOCATIONS = process.env.MEILI_INDEX_LOCATIONS || "mx_locations_v1";

let client: MeiliSearch | null = null;

export function isMeiliConfigured(): boolean {
  return Boolean(MEILI_HOST && MEILI_API_KEY);
}

export function getClient(): MeiliSearch {
  if (!client) {
    if (!isMeiliConfigured()) {
      throw new Error("Meilisearch no está configurado. Define MEILI_HOST y MEILI_API_KEY");
    }
    client = new MeiliSearch({ host: MEILI_HOST, apiKey: MEILI_API_KEY });
  }
  return client;
}

export function getIndex() {
  const c = getClient();
  return c.index(MEILI_INDEX_LOCATIONS);
}

export async function ensureIndex() {
  const c = getClient();
  try {
    await c.getIndex(MEILI_INDEX_LOCATIONS);
  } catch {
    await c.createIndex(MEILI_INDEX_LOCATIONS, { primaryKey: "id" });
  }
  const idx = c.index(MEILI_INDEX_LOCATIONS);
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

export async function getIndexStats() {
  const idx = getIndex();
  const [st, mt, ct, nt] = await Promise.all([
    idx.search("", { filter: 'type = "state"', limit: 1 }),
    idx.search("", { filter: 'type = "municipality"', limit: 1 }),
    idx.search("", { filter: 'type = "city"', limit: 1 }),
    idx.search("", { filter: 'type = "neighborhood"', limit: 1 }),
  ]);
  const settings = await idx.getSettings();
  return {
    states: st.estimatedTotalHits ?? (st.hits?.length || 0),
    municipalities: mt.estimatedTotalHits ?? (mt.hits?.length || 0),
    cities: ct.estimatedTotalHits ?? (ct.hits?.length || 0),
    neighborhoods: nt.estimatedTotalHits ?? (nt.hits?.length || 0),
    settings: {
      searchable: settings.searchableAttributes,
      filterable: settings.filterableAttributes,
      sortable: settings.sortableAttributes,
    },
  } as const;
}

export async function probeQueries(qs: string[]) {
  const idx = getIndex();
  for (const q of qs) {
    const [s, m, c] = await Promise.all([
      idx.search(q, { filter: 'type = "state"', limit: 10 }),
      idx.search(q, { filter: 'type = "municipality"', limit: 15 }),
      idx.search(q, { filter: 'type = "city"', limit: 15 }),
    ]);
    const top = (r: any, n: number) => (r.hits || []).slice(0, n).map((h: any) => h.name).join(", ");
    console.log(`【Meili Probe】q="${q}"`);
    console.log(`  states: ${top(s, 5)}`);
    console.log(`  municipalities: ${top(m, 5)}`);
    console.log(`  cities: ${top(c, 5)}`);
  }
}
