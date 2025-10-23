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
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function loadLocations(): Promise<Raw[]> {
  const candidates = [
    "locations.mx.json",
    "./locations.mx.json",
    "/locations.mx.json",
  ];
  for (const u of candidates) {
    try {
      const res = await fetch(u, { cache: "force-cache" });
      if (res.ok) return (await res.json()) as Raw[];
    } catch (_) {
      // try next
    }
  }
  return [];
}

// cache global
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
    if (term.length < 2) {
      setOptions([]);
      setOpen(false);
      return;
    }

    let cancelled = false;
    const id = setTimeout(async () => {
      try {
        setLoading(true);
        if (!LOC_CACHE) LOC_CACHE = await loadLocations();

        const nq = normalize(term.trim());
        const opts =
          (LOC_CACHE || [])
            .filter(
              (r) =>
                normalize(r.stateName).includes(nq) ||
                normalize(r.municipalityName).includes(nq)
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
      } catch {
        if (!cancelled) {
          setOptions([]);
          setOpen(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

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
      {open && options.length > 0 && (
        <ul className="absolute z-30 bg-white border shadow-md rounded-lg mt-1 w-full max-h-60 overflow-auto">
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
      )}
    </div>
  );
}
