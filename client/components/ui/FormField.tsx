import React from "react";

export default function FormField({
  label,
  htmlFor,
  hint,
  error,
  children,
  required,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
