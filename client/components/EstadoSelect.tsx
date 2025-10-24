import React from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  disabled?: boolean;
  label?: string;
  id?: string;
};

export default function EstadoSelect({
  value,
  onChange,
  options,
  disabled,
  label = "Estado",
  id = "estado",
}: Props) {
  return (
    <label className="block space-y-1 w-full">
      <span className="text-sm font-medium">{label}</span>
      <select
        id={id}
        aria-label={label}
        className="select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">Selecciona un estado…</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}
