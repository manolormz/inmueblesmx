import { useEffect, useMemo, useState } from "react";

type Row = {
  state: string;
  municipality: string;
};

const normalize = (s: string) =>
  s
    ?.toLowerCase()
    ?.normalize("NFD")
    ?.replace(/[\u0300-\u036f]/g, "")
    ?.trim() ?? "";

async function tryFetch(url: string) {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`No se pudo cargar ${url} (${res.status})`);
  return res.json();
}

/**
 * Intenta múltiples rutas por si el archivo no se llama exactamente igual en /public.
 */
async function loadLocations() {
  const candidates = [
    "/municipalities.mx.json",
    "/municipalities.json",
    "/data/municipalities.mx.json",
    "/data/municipalities.json",
    "/locations.mx.json",
    "/data/locations.mx.json",
  ];
  let lastErr: any = null;
  for (const url of candidates) {
    try {
      const json = await tryFetch(url);
      return { data: json, urlHit: url };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("No se encontró un JSON de ubicaciones en /public");
}

export function useLocations() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data, urlHit } = await loadLocations();
        const normalized: Row[] = (Array.isArray(data) ? data : [])
          .map((r: any) => ({
            state: String(r.state ?? r.estado ?? r.State ?? r.Estado ?? ""),
            municipality: String(r.municipality ?? r.municipio ?? r.Municipality ?? r.Municipio ?? ""),
          }))
          .filter((r) => r.state && r.municipality);

        if (!alive) return;
        setRows(normalized);
        setSourceUrl(urlHit);
      } catch (e: any) {
        if (!alive) return;
        setError(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const states = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) set.add(r.state);
    return Array.from(set).sort((a, b) => normalize(a).localeCompare(normalize(b)));
  }, [rows]);

  const municipalitiesByState = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const r of rows) {
      const list = map.get(r.state) ?? [];
      list.push(r.municipality);
      map.set(r.state, list);
    }
    for (const [k, list] of map) {
      const dedup = Array.from(new Set(list)).sort((a, b) => normalize(a).localeCompare(normalize(b)));
      map.set(k, dedup);
    }
    return map;
  }, [rows]);

  const findMunicipalities = (state: string) => {
    const norm = normalize(state);
    for (const key of municipalitiesByState.keys()) {
      if (normalize(key) === norm) return municipalitiesByState.get(key) ?? [];
    }
    return [];
  };

  return { loading, error, rows, states, municipalitiesByState, findMunicipalities, normalize, sourceUrl };
}
