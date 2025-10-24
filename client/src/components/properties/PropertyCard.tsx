import React from "react";
import type { Property } from "@/src/services/properties";

export default function PropertyCard({ property }: { property: Property }) {
  const { id, title, price, image, type, municipality, state, badges } = property;
  return (
    <article className="rounded-2xl bg-white shadow-card hover:shadow-lg transition overflow-hidden">
      <a href={`#/property/${id}`} className="block focus:outline-none focus:ring-2 focus:ring-primary/50">
        <img src={image || "/placeholder.svg"} alt={title} className="w-full aspect-[4/3] object-cover" />
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {type && <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full border">{type}</span>}
            {badges?.map((b) => (
              <span key={b} className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">{b}</span>
            ))}
          </div>
          <h3 className="font-semibold text-base">{title}</h3>
          <div className="text-primary font-semibold">
            {typeof price === "number"
              ? new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(price)
              : "Consultar"}
          </div>
          <div className="text-sm text-gray-600">
            {[municipality, state].filter(Boolean).join(", ")}
          </div>
        </div>
      </a>
    </article>
  );
}
