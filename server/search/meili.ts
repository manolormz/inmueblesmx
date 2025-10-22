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
    sortableAttributes: ["popularity", "name"],
    filterableAttributes: ["type", "state", "city", "city_slug", "parent_slug"],
    searchableAttributes: ["name", "search_keywords", "postal_codes", "city", "state"],
    rankingRules: ["typo", "words", "proximity", "attribute", "exactness", "sort"],
  });
  return idx;
}
