import { useState, useEffect } from "react";

type Option = {
  id: string;
  label: string;
  stateId: string | number;
  municipalityId: string | number;
};

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

    const controller = new AbortController();
    const id = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/locations?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (!res.ok) return;
        const json = await res.json();
        setOptions((json.results || []) as Option[]);
        setOpen(true);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
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
        <div className="absolute right-2 top-2 text-gray-400 text-sm">...</div>
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
