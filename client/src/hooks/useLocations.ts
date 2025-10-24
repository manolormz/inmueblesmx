import { useEffect, useMemo, useState } from "react";
import staticLocations from "../data/locations.mx.json";

export type Option = { value: string; label: string };

type LocationsShape =
  | string[]
  | {
      states?: string[];
      municipalities?: Record<string, string[]>;
      map?: Record<string, string[]>;
      data?: Record<string, string[]>;
    };

const normalize = (s: string) =>
  s
    ?.toLowerCase()
    ?.normalize("NFD")
    ?.replace(/[\u0300-\u036f]/g, "")
    ?.trim() ?? "";

const makeUrlCandidates = () => {
  const base = (import.meta as any).env?.BASE_URL || "/";
  const a = base.endsWith("/") ? base : base + "/";
  return Array.from(new Set([`${a}locations.mx.json`, "/locations.mx.json"]));
};

function parseLocations(json: LocationsShape): {
  states: string[];
  map: Map<string, string[]>;
} {
  if (Array.isArray(json)) {
    if (json.length === 0) return { states: [], map: new Map() };
    if (typeof json[0] === "string") {
      const states = (json as string[]).filter(
        (x) => typeof x === "string",
      ) as string[];
      return { states, map: new Map() };
    }
    const map = new Map<string, string[]>();
    const set = new Set<string>();
    for (const anyRow of json as any[]) {
      const s = String(anyRow.stateName || anyRow.state || anyRow.Estado || "");
      const m = String(
        anyRow.municipalityName ||
          anyRow.municipality ||
          anyRow.Municipio ||
          "",
      );
      if (!s || !m) continue;
      set.add(s);
      const list = map.get(s) ?? [];
      list.push(m);
      map.set(s, list);
    }
    const states = Array.from(set).sort((a, b) =>
      normalize(a).localeCompare(normalize(b)),
    );
    for (const [k, list] of map)
      map.set(
        k,
        Array.from(new Set(list)).sort((a, b) =>
          normalize(a).localeCompare(normalize(b)),
        ),
      );
    return { states, map };
  }

  if (json && Array.isArray(json.states)) {
    const states = json.states.slice();
    const map = new Map<string, string[]>();
    const src = (json.municipalities || json.map || json.data || {}) as Record<
      string,
      string[]
    >;
    for (const k of Object.keys(src)) map.set(k, src[k] || []);
    return { states, map };
  }

  if (json && (json.municipalities || json.map || json.data)) {
    const src = (json.municipalities || json.map || json.data) as Record<
      string,
      string[]
    >;
    const states = Object.keys(src);
    const map = new Map<string, string[]>();
    for (const k of states) map.set(k, src[k] || []);
    return { states, map };
  }

  return { states: [], map: new Map() };
}

async function loadFromStatic(): Promise<{
  states: string[];
  map: Map<string, string[]>;
}> {
  const raw: LocationsShape =
    (staticLocations as any)?.default ?? (staticLocations as any);
  return parseLocations(raw);
}

async function loadFromFetch(): Promise<{
  states: string[];
  map: Map<string, string[]>;
}> {
  const candidates = makeUrlCandidates();
  let lastErr: any = null;
  for (const url of candidates) {
    try {
      console.info("[useLocations] fetch:", url);
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`);
      const raw = (await res.json()) as LocationsShape;
      return parseLocations(raw);
    } catch (e) {
      lastErr = e;
      console.warn("[useLocations] fetch fail:", e);
    }
  }
  throw lastErr || new Error("No fetchable locations");
}

export function useLocations() {
  const [states, setStates] = useState<string[]>([]);
  const [municipalitiesByState, setMap] = useState<Map<string, string[]>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await loadFromStatic();
        if (cancelled) return;
        setStates(s.states);
        setMap(s.map);
        console.info("[useLocations] static ok:", s.states.length);
      } catch (e) {
        console.warn("[useLocations] static import failed, trying fetch…", e);
        try {
          const f = await loadFromFetch();
          if (cancelled) return;
          setStates(f.states);
          setMap(f.map);
          console.info("[useLocations] fetch ok:", f.states.length);
        } catch (err2) {
          console.error("[useLocations] final error:", err2);
          if (!cancelled) {
            setStates([]);
            setMap(new Map());
            setError(err2 as any);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      console.info(
        "[useLocations] states:",
        states.length,
        "sample:",
        states.slice(0, 3),
      );
    } catch {}
  }, [states]);

  const findMunicipalities = (state: string) => {
    const norm = normalize(state);
    for (const key of municipalitiesByState.keys()) {
      if (normalize(key) === norm) return municipalitiesByState.get(key) ?? [];
    }
    return [];
  };

  return {
    loading,
    error,
    states,
    municipalitiesByState,
    findMunicipalities,
    normalize,
  };
}

export function toOptions(items: string[]): Option[] {
  return (items || []).map((s) => ({ value: s, label: s }));
}

// Optional: stub for useProperties if not present in project
let useProperties: undefined | (() => { items: any[] });
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  useProperties = require("../hooks/useProperties").useProperties;
} catch {}

export function useLocationOptions() {
  const { states, findMunicipalities } = useLocations();
  const stateOptions: Option[] = toOptions(states);
  const municipalityOptions = (estado: string): Option[] => {
    const ms = estado ? findMunicipalities(estado) : [];
    return toOptions(ms);
  };
  return { stateOptions, municipalityOptions };
}

export function useLocationOptionsSorted(
  sortBy: "alpha" | "popular" = "alpha",
) {
  const { states, findMunicipalities } = useLocations();
  const props = useProperties ? useProperties() : { items: [] as any[] };
  const items = props?.items || [];

  const countsByState = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of items) {
      const st = (p.state ?? (p as any).estado ?? "").toString().trim();
      if (!st) continue;
      m.set(st, (m.get(st) || 0) + 1);
    }
    return m;
  }, [items]);

  const stateOptions = useMemo(() => {
    const arr = [...states];
    if (sortBy === "popular") {
      arr.sort(
        (a, b) =>
          (countsByState.get(b) || 0) - (countsByState.get(a) || 0) ||
          a.localeCompare(b, "es"),
      );
    } else {
      arr.sort((a, b) => a.localeCompare(b, "es"));
    }
    return arr.map((s) => {
      const c = countsByState.get(s);
      return {
        value: s,
        label: c ? `${s} (${c})` : s,
        raw: s,
        count: c || 0,
      } as any;
    });
  }, [states, countsByState, sortBy]);

  const municipalityOptions = (estado: string, query?: string) => {
    const list = estado ? findMunicipalities(estado) : [];
    const filtered = query
      ? list.filter((m) => m.toLowerCase().includes(query.toLowerCase()))
      : list;
    return filtered.map((m) => ({ value: m, label: m, raw: m }));
  };

  return { stateOptions, municipalityOptions, countsByState };
}
