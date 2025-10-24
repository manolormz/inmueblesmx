import { useEffect, useMemo, useState } from "react";

type Row = {
  state: string;
  municipality: string;
};

const normalize = (s: string) =>
  s?.toLowerCase()?.normalize("NFD")?.replace(/[\u0300-\u036f]/g, "")?.trim() ?? "";

export function useLocations() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const sourceUrl = "/locations.mx.json";

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        console.info("[useLocations] fetching", sourceUrl);
        const res = await fetch(sourceUrl, { cache: "force-cache" });
        if (!res.ok) throw new Error(`No se pudo cargar ${sourceUrl} (${res.status})`);
        const data = await res.json();
        const normalized: Row[] = (Array.isArray(data) ? data : [])
          .map((r: any) => ({
            state: String(r.state ?? r.estado ?? r.State ?? r.Estado ?? ""),
            municipality: String(r.municipality ?? r.municipio ?? r.Municipality ?? r.Municipio ?? ""),
          }))
          .filter((r) => r.state && r.municipality);
        if (!alive) return;
        setRows(normalized);
      } catch (err: any) {
        if (!alive) return;
        console.error("[useLocations] error:", err);
        setRows([]);
        setError(err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [sourceUrl]);

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

  useEffect(() => {
    try {
      console.info("[useLocations] states:", states.length, "sample:", states.slice(0, 3));
    } catch {}
  }, [states]);

  const findMunicipalities = (state: string) => {
    const norm = normalize(state);
    for (const key of municipalitiesByState.keys()) {
      if (normalize(key) === norm) return municipalitiesByState.get(key) ?? [];
    }
    return [];
  };

  return { loading, error, rows, states, municipalitiesByState, findMunicipalities, normalize, sourceUrl };
}
