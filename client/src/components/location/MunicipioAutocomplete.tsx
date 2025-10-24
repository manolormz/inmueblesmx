import React, { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

type Opt = { value: string; label: string };

export default function MunicipioAutocomplete({
  value,
  onChange,
  options,
  placeholder = "Selecciona municipio",
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Opt[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const list = useMemo(() => {
    const L = q
      ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()))
      : options;
    return L.slice(0, 50);
  }, [q, options]);

  return (
    <div ref={wrapRef} className="relative">
      <div
        className={`input flex items-center gap-2 ${disabled ? "opacity-60 pointer-events-none" : ""}`}
        role="combobox"
        aria-expanded={open}
      >
        <input
          className="flex-1 bg-transparent outline-none"
          value={q || value}
          placeholder={placeholder}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        {value && (
          <button
            type="button"
            className="text-gray-500"
            aria-label="Limpiar municipio"
            onClick={() => {
              onChange("");
              setQ("");
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>
      {open && list.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full bg-white border rounded-xl shadow-card max-h-64 overflow-auto">
          {list.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                className={`w-full text-left px-3 py-2 hover:bg-secondary/60`}
                onClick={() => {
                  onChange(o.value);
                  setQ(o.label);
                  setOpen(false);
                }}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
