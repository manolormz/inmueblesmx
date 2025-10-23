import { useEffect, useMemo, useState } from "react";

type Raw = {
  stateId: string;
  stateName: string;
  municipalityId: string;
  municipalityName: string;
};

export type StateMunicipalityValue = {
  stateId: string | null;
  municipalityId: string | null;
  label: string;
};

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const FALLBACK_DATA: Raw[] = [
  { stateId: "GUA", stateName: "Guanajuato", municipalityId: "LEO", municipalityName: "León" },
  { stateId: "GUA", stateName: "Guanajuato", municipalityId: "IRA", municipalityName: "Irapuato" },
  { stateId: "SIN", stateName: "Sinaloa", municipalityId: "CUL", municipalityName: "Culiacán" },
  { stateId: "SON", stateName: "Sonora", municipalityId: "HMO", municipalityName: "Hermosillo" },
  { stateId: "PUE", stateName: "Puebla", municipalityId: "PUE", municipalityName: "Puebla" },
  { stateId: "CMX", stateName: "Ciudad de México", municipalityId: "BJ", municipalityName: "Benito Juárez" },
];

let LOC_CACHE: Raw[] | null = null;

async function loadLocations(): Promise<Raw[]> {
  const v = Date.now();
  const candidates = [
    `locations.mx.json?v=${v}`,
    `./locations.mx.json?v=${v}`,
    `/locations.mx.json?v=${v}`,
  ];
  for (const u of candidates) {
    try {
      const res = await fetch(u, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) return json as Raw[];
      }
    } catch {}
  }
  return FALLBACK_DATA;
}

export default function StateMunicipalityField({
  value,
  onChange,
  requiredState = true,
}: {
  value?: StateMunicipalityValue | null;
  onChange: (val: StateMunicipalityValue | null) => void;
  requiredState?: boolean;
}) {
  const [dataCount, setDataCount] = useState(0);
  const [usedFallback, setUsedFallback] = useState(false);
  const [loading, setLoading] = useState(false);

  const [stateId, setStateId] = useState<string | "">(value?.stateId ?? "");
  const [municipalityId, setMunicipalityId] = useState<string | "ALL" | "">(value?.municipalityId ?? "ALL");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!LOC_CACHE) {
        setLoading(true);
        try {
          const data = await loadLocations();
          LOC_CACHE = data;
          if (!cancelled) {
            setDataCount(data.length);
            setUsedFallback(data.length <= FALLBACK_DATA.length);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const states = useMemo(() => {
    const src = LOC_CACHE || [];
    const map = new Map<string, string>();
    for (const r of src) if (!map.has(r.stateId)) map.set(r.stateId, r.stateName);
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [LOC_CACHE, dataCount]);

  const municipalities = useMemo(() => {
    if (!stateId || !LOC_CACHE) return [] as { id: string; name: string }[];
    return LOC_CACHE
      .filter((r) => r.stateId === stateId)
      .map((r) => ({ id: r.municipalityId, name: r.municipalityName }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [stateId, LOC_CACHE]);

  useEffect(() => {
    if (!stateId) {
      if (requiredState) { onChange(null); return; }
      onChange({ stateId: null, municipalityId: null, label: "Todos los estados" });
      return;
    }
    const sName = states.find((s) => s.id === stateId)?.name || "";
    if (municipalityId === "ALL" || !municipalityId) {
      onChange({ stateId, municipalityId: null, label: `Todos los municipios, ${sName}` });
      return;
    }
    const mName = LOC_CACHE?.find((r) => r.stateId === stateId && r.municipalityId === municipalityId)?.municipalityName || "";
    onChange({ stateId, municipalityId, label: `${mName}, ${sName}` });
  }, [stateId, municipalityId, states, requiredState]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
      {/* Estado */}
      <div className="md:col-span-2">
        <label className="block text-left text-sm text-gray-600 mb-1">Estado</label>
        <select
          className="border rounded-lg p-2 w-full"
          value={stateId}
          onChange={(e) => {
            setStateId(e.target.value);
            setMunicipalityId("ALL");
          }}
        >
          <option value="">{requiredState ? "Selecciona un estado" : "Todos los estados"}</option>
          {states.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        {dataCount > 0 && (
          <div className="mt-1 text-xs text-gray-400">dataset: {dataCount}{usedFallback ? " (fallback)" : ""}</div>
        )}
      </div>

      {/* Municipio */}
      <div className="md:col-span-3">
        <label className="block text-left text-sm text-gray-600 mb-1">Municipio</label>
        <select
          className="border rounded-lg p-2 w-full"
          value={municipalityId}
          onChange={(e) => setMunicipalityId(e.target.value as any)}
          disabled={!stateId || loading}
        >
          <option value="ALL">Todos los municipios</option>
          {municipalities.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
