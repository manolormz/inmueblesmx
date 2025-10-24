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
  s?.toLowerCase()?.normalize("NFD")?.replace(/[\u0300-\u036f]/g, "")?.trim() ?? "";

const makeUrlCandidates = () => {
  const base = (import.meta as any).env?.BASE_URL || "/";
  const a = base.endsWith("/") ? base : base + "/";
  return Array.from(new Set([`${a}locations.mx.json`, "/locations.mx.json"]));
};

function parseLocations(json: LocationsShape): { states: string[]; map: Map<string, string[]> } {
  if (Array.isArray(json)) {
    const states = json.filter((x) => typeof x === "string") as string[];
    return { states, map: new Map() };
  }

  if (json && Array.isArray(json.states)) {
    const states = json.states.slice();
    const map = new Map<string, string[]>();
    const src = (json.municipalities || json.map || json.data || {}) as Record<string, string[]>;
    for (const k of Object.keys(src)) map.set(k, src[k] || []);
    return { states, map };
  }

  if (json && (json.municipalities || json.map || json.data)) {
    const src = (json.municipalities || json.map || json.data) as Record<string, string[]>;
    const states = Object.keys(src);
    const map = new Map<string, string[]>();
    for (const k of states) map.set(k, src[k] || []);
    return { states, map };
  }

  return { states: [], map: new Map() };
}

async function loadLocations(): Promise<{ states: string[]; map: Map<string, string[]> }> {
  const candidates = makeUrlCandidates();
  let lastErr: any = null;

  for (const url of candidates) {
    try {
      console.info("[useLocations] trying:", url);
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status} at ${url}`);
      const raw = (await res.json()) as LocationsShape;
      const { states, map } = parseLocations(raw);
      console.info("[useLocations] parsed:", states.length, "states");
      return { states, map };
    } catch (e) {
      lastErr = e;
      console.warn("[useLocations] failed:", e);
    }
  }

  // Optional runtime-only fallback import (avoids bundler resolution)
  try {
    const dynImport: any = new Function("p", "return import(p)");
    const mod: any = await dynImport("../data/locations.mx.json");
    const raw: LocationsShape = mod?.default ?? mod;
    const { states, map } = parseLocations(raw);
    console.info("[useLocations] fallback import ok:", states.length, "states");
    return { states, map };
  } catch (_ignore) {}

  throw lastErr || new Error("No se pudo cargar locations.mx.json");
}

export function useLocations() {
  const [states, setStates] = useState<string[]>([]);
  const [municipalitiesByState, setMap] = useState<Map<string, string[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadLocations()
      .then(({ states, map }) => {
        if (cancelled) return;
        setStates(states);
        setMap(map);
      })
      .catch((err) => {
        console.error("[useLocations] error final:", err);
        if (cancelled) return;
        setStates([]);
        setMap(new Map());
        setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  return { loading, error, states, municipalitiesByState, findMunicipalities, normalize };
}

export function toOptions(items: string[]): Option[] {
  return (items || []).map((s) => ({ value: s, label: s }));
}

export function useLocationOptions() {
  const { states, findMunicipalities } = useLocations();
  const stateOptions: Option[] = toOptions(states);
  const municipalityOptions = (estado: string): Option[] => {
    const ms = estado ? findMunicipalities(estado) : [];
    return toOptions(ms);
  };
  return { stateOptions, municipalityOptions };
}
