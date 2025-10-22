#!/usr/bin/env tsx
import fs from "fs";
import path from "path";
import { ensureIndex, getIndex, isMeiliConfigured, MEILI_INDEX_LOCATIONS } from "../../server/search/meili";

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

async function main() {
  if (!isMeiliConfigured()) {
    console.error("Meilisearch no está configurado. Define MEILI_HOST, MEILI_API_KEY y opcionalmente MEILI_INDEX_LOCATIONS.");
    process.exit(1);
  }
  const args = parseArgs(process.argv);
  const file = args.file || args.f || args.input || args.i;
  if (!file) {
    console.error("Uso: tsx scripts/ingest/push_to_meili.ts --file=locations.json");
    process.exit(1);
  }
  const full = path.resolve(file);
  const data = JSON.parse(fs.readFileSync(full, "utf8"));
  if (!Array.isArray(data)) {
    console.error("El archivo no es un array JSON válido");
    process.exit(1);
  }

  await ensureIndex();
  const index = getIndex();

  const chunkSize = 5000;
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    const task = await index.addDocuments(chunk, { primaryKey: "id" });
    await index.client.waitForTask(task.taskUid);
    // eslint-disable-next-line no-console
    console.log(`Subidos ${Math.min(i + chunkSize, data.length)}/${data.length} a ${MEILI_INDEX_LOCATIONS}`);
  }

  // eslint-disable-next-line no-console
  console.log("Completado.");
}

main().catch((e) => { console.error(e); process.exit(1); });
