import { useState, useEffect } from "react";

type Raw = {
  stateId: string;
  stateName: string;
  municipalityId: string;
  municipalityName: string;
};

type Option = {
  id: string;
  label: string;
  stateId: string;
  municipalityId: string;
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Fallback mínimo por si no se puede cargar ningún JSON */
const FALLBACK_DATA: Raw[] = [
  {
    stateId: "GUA",
    stateName: "Guanajuato",
    municipalityId: "LEO",
    municipalityName: "León",
  },
  {
    stateId: "GUA",
    stateName: "Guanajuato",
    municipalityId: "IRA",
    municipalityName: "Irapuato",
  },
  {
    stateId: "SIN",
    stateName: "Sinaloa",
    municipalityId: "CUL",
    municipalityName: "Culiacán",
  },
  {
    stateId: "SIN",
    stateName: "Sinaloa",
    municipalityId: "MAZ",
    municipalityName: "Mazatlán",
  },
  {
    stateId: "SON",
    stateName: "Sonora",
    municipalityId: "HMO",
    municipalityName: "Hermosillo",
  },
  {
    stateId: "SON",
    stateName: "Sonora",
    municipalityId: "NOG",
    municipalityName: "Nogales",
  },
  {
    stateId: "PUE",
    stateName: "Puebla",
    municipalityId: "PUE",
    municipalityName: "Puebla",
  },
  {
    stateId: "PUE",
    stateName: "Puebla",
    municipalityId: "SAC",
    municipalityName: "San Andrés Cholula",
  },
  {
    stateId: "CMX",
    stateName: "Ciudad de México",
    municipalityId: "BJ",
    municipalityName: "Benito Juárez",
  },
  {
    stateId: "CMX",
    stateName: "Ciudad de México",
    municipalityId: "MH",
    municipalityName: "Miguel Hidalgo",
  },
];

async function loadLocations(): Promise<Raw[]> {
  const candidates = [
    "locations.mx.json", // público relativo
    "./locations.mx.json",
    "/locations.mx.json", // público raíz
  ];
  for (const u of candidates) {
    try {
      const res = await fetch(u, { cache: "force-cache" });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) return json as Raw[];
      }
    } catch {
      // sigue al siguiente
    }
  }
  return FALLBACK_DATA;
}

// cache en memoria
let LOC_CACHE: Raw[] | null = null;

export default function LocationField({
  value,
  onChange,
}: {
  value?: Option | null;
  onChange: (opt: Option | null) => void;
}) {
  const [term, setTerm] = useState(value?.label || "");
  const [options, setOptions] = useState<Option[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const t = term.trim();
      if (t.length < 2) {
        setOptions([]);
        setOpen(false);
        return;
      }

      setLoading(true);
      try {
        if (!LOC_CACHE) LOC_CACHE = await loadLocations();

        const nq = normalize(t);
        const opts = (LOC_CACHE || [])
          .filter(
            (r) =>
              normalize(r.stateName).includes(nq) ||
              normalize(r.municipalityName).includes(nq),
          )
          .slice(0, 25)
          .map((r) => ({
            id: `${r.stateId}-${r.municipalityId}`,
            label: `${r.municipalityName}, ${r.stateName}`,
            stateId: r.stateId,
            municipalityId: r.municipalityId,
          }));

        if (!cancelled) {
          setOptions(opts);
          setOpen(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const id = setTimeout(run, 250);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [term]);

  function select(opt: Option) {
    setTerm(opt.label);
    onChange(opt);
    setOpen(false);
  }

  return (
    <div className="relative w-full">
      <input
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          onChange(null);
        }}
        onFocus={() => term.length >= 2 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder="Ubicación (estado o municipio)"
        className="border rounded-lg p-2 w-full"
        autoComplete="off"
      />
      {loading && (
        <div className="absolute right-2 top-2 text-gray-400 text-sm">…</div>
      )}
      {open && (
        <div className="absolute z-30 mt-1 w-full">
          {options.length > 0 ? (
            <ul className="bg-white border shadow-md rounded-lg max-h-60 overflow-auto">
              {options.map((opt) => (
                <li key={opt.id}>
                  <button
                    type="button"
                    onMouseDown={() => select(opt)}
                    className="block text-left w-full px-3 py-2 hover:bg-gray-100"
                  >
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="bg-white border shadow-md rounded-lg px-3 py-2 text-sm text-gray-600">
              No hay coincidencias
            </div>
          )}
        </div>
      )}
    </div>
  );
}
