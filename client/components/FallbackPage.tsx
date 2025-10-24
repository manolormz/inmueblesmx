import React from "react";
export default function FallbackPage({ title = "Kentra", note }: { title?: string; note?: string }) {
  return (
    <div className="max-w-3xl mx-auto my-10 space-y-3">
      <h1 className="font-display text-2xl text-primary">{title}</h1>
      <p className="text-sm text-gray-700">Vista mínima cargada para evitar pantalla en blanco.</p>
      {note && (
        <pre className="text-xs bg-gray-50 p-3 rounded-2xl border whitespace-pre-wrap">{note}</pre>
      )}
    </div>
  );
}
