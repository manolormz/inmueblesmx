// netlify/functions/locations.ts
import type { Handler } from "@netlify/functions";
import fs from "node:fs";
import path from "node:path";

let CACHE: any[] | null = null;

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function loadMunicipalities(): any[] {
  if (CACHE) return CACHE;

  // Rutas candidatas (dev/build)
  const candidates = [
    path.join(process.cwd(), "shared", "data", "municipalities.mx.json"), // repo root
    path.join(
      __dirname,
      "..",
      "..",
      "shared",
      "data",
      "municipalities.mx.json",
    ), // bundled
    path.join(
      process.cwd(),
      "dist",
      "shared",
      "data",
      "municipalities.mx.json",
    ), // dist
  ];

  let filePath = "";
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      filePath = p;
      break;
    }
  }

  if (!filePath) {
    // No se encontró el archivo
    CACHE = [];
    return CACHE;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  CACHE = JSON.parse(raw);
  return CACHE!;
}

export const handler: Handler = async (event) => {
  try {
    const q = (event.queryStringParameters?.q || "").toString();
    const limit = Number(event.queryStringParameters?.limit || 25);

    const nq = normalize(q.trim());
    if (nq.length < 2) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ results: [] }),
      };
    }

    const data = loadMunicipalities(); // <- lee con fs (cacheado)
    const results = data
      .filter((r: any) => {
        return (
          normalize(r.stateName).includes(nq) ||
          normalize(r.municipalityName).includes(nq)
        );
      })
      .slice(0, limit)
      .map((r: any) => ({
        id: `${r.stateId}-${r.municipalityId}`,
        label: `${r.municipalityName}, ${r.stateName}`,
        stateId: r.stateId,
        municipalityId: r.municipalityId,
      }));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ results }),
    };
  } catch (err: any) {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        results: [],
        error: "failed_to_load_locations",
        details: String(err?.message || err),
      }),
    };
  }
};
