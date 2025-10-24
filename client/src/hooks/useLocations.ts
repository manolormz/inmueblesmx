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

const makeUrlCandidates = () => {
  const base = (import.meta as any).env?.BASE_URL || "/";
  const a = base.endsWith("/") ? base : base + "/";
  const candidates = [`${a}locations.mx.json`, "/locations.mx.json"];
  return Array.from(new Set(candidates));
};

async function loadLocations(): Promise<{
  states: string[];
  map: Map<string, string[]>;
}> {
  const candidates = makeUrlCandidates();
  let lastErr: any = null;

  for (const url of candidates) {
    try {
      console.info("[useLocations] trying:", url);
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status} at ${url}`);
      const json = await res.json();
      const states: string[] = json.states ?? Object.keys(json) ?? [];
      const map = new Map<string, string[]>();

      if (json.municipalities && typeof json.municipalities === "object") {
        for (const k of Object.keys(json.municipalities)) {
          map.set(k, json.municipalities[k] || []);
        }
      } else if (json.map && typeof json.map === "object") {
        for (const k of Object.keys(json.map)) {
          map.set(k, json.map[k] || []);
        }
      } else if (states.length && json.data) {
        for (const k of Object.keys(json.data)) {
          map.set(k, json.data[k] || []);
        }
      }

      console.info("[useLocations] loaded:", states.length, "states");
      return { states, map };
    } catch (e) {
      lastErr = e;
      console.warn("[useLocations] failed:", e);
    }
  }

  throw lastErr || new Error("No se pudo cargar locations.mx.json");
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

export type Option = { value: string; label: string };

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
