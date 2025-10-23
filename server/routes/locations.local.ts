import type { Request, Response } from "express";
import fs from "fs";
import path from "path";

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function handleLocationsLocal(req: Request, res: Response) {
  const query = String(req.query.q || "");
  const normQ = normalize(query);
  const limit = Number(req.query.limit || 25);

  if (!normQ || normQ.length < 2) {
    return res.json({ results: [] });
  }

  try {
    const file = path.resolve(
      process.cwd(),
      "shared/data/municipalities.mx.json",
    );
    const raw = fs.readFileSync(file, "utf-8");
    const data = JSON.parse(raw) as any[];

    const results = data
      .filter(
        (r: any) =>
          normalize(r.stateName).includes(normQ) ||
          normalize(r.municipalityName).includes(normQ),
      )
      .slice(0, limit)
      .map((r: any) => ({
        id: `${r.stateId}-${r.municipalityId}`,
        label: `${r.municipalityName}, ${r.stateName}`,
        stateId: r.stateId,
        municipalityId: r.municipalityId,
      }));

    res.json({ results });
  } catch (e) {
    res.status(500).json({ results: [], error: "failed_to_load_locations" });
  }
}
