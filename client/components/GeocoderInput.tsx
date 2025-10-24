import { useEffect, useMemo, useState } from "react";

export type GeocodeFeature = {
  id: string;
  place_name: string;
  center: [number, number];
  bbox?: [number, number, number, number];
};

function debounce<T extends (...args: any[]) => void>(fn: T, ms = 300) {
  let t: number | undefined;
  return (...args: Parameters<T>) => {
    window.clearTimeout(t);
    // @ts-ignore
    t = window.setTimeout(() => fn(...args), ms);
  };
}

export default function GeocoderInput({
  onPick,
}: {
  onPick: (f: GeocodeFeature) => void;
}) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<GeocodeFeature[]>([]);
  const [open, setOpen] = useState(false);

  const search = useMemo(
    () =>
      debounce(async (value: string) => {
        if (!value || value.trim().length < 2) {
          setItems([]);
          return;
        }
        try {
          const res = await fetch(
            `/api/geocode?q=${encodeURIComponent(value)}&limit=5`,
          );
          if (!res.ok) return;
          const data = await res.json();
          setItems((data?.features || []) as GeocodeFeature[]);
        } catch {}
      }, 250),
    [],
  );

  useEffect(() => {
    search(q);
  }, [q, search]);

  return (
    <div className="relative">
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar zona..."
        className="h-9 px-3 rounded-lg border bg-white/95 backdrop-blur text-sm"
      />
      {open && items.length > 0 && (
        <div className="absolute left-0 mt-1 w-[320px] max-w-[80vw] bg-white border rounded-lg shadow z-30">
          <ul className="max-h-64 overflow-auto text-sm">
            {items.map((it) => (
              <li key={it.id}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-gray-50"
                  onClick={() => {
                    setOpen(false);
                    onPick(it);
                  }}
                >
                  {it.place_name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
