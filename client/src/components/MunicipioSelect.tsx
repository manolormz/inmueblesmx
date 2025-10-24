import React from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  disabled?: boolean;
  label?: string;
  id?: string;
};

export default function MunicipioSelect({
  value,
  onChange,
  options,
  disabled,
  label = "Municipio",
  id = "municipio",
}: Props) {
  return (
    <label className="block space-y-1 w-full">
      <span className="text-sm font-medium">{label}</span>
      <select
        id={id}
        className="w-full rounded-2xl border p-3 shadow-sm focus:outline-none focus:ring"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || options.length === 0}
      >
        <option value="">
          {options.length ? "Selecciona un municipio…" : "Selecciona primero un estado"}
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}
