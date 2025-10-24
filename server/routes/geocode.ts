import type { Request, Response } from "express";

export async function handleGeocode(req: Request, res: Response) {
  try {
    const q = String(req.query.q || "").trim();
    const limit = Math.min(
      parseInt(String(req.query.limit || "5"), 10) || 5,
      10,
    );
    if (!q) return res.json({ type: "FeatureCollection", features: [] });
    const token =
      process.env.MAPBOX_ACCESS_TOKEN || process.env.VITE_MAPBOX_TOKEN;
    if (!token) return res.status(500).json({ error: "Missing MAPBOX token" });
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?limit=${limit}&language=es&country=mx&access_token=${token}`;
    const r = await fetch(url);
    const data = await r.json();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
}
