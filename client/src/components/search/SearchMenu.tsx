import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

type SortValue = "relevance" | "price_asc" | "price_desc" | "area_asc" | "area_desc";

const CHIP_KEYS = ["jardin", "alberca", "mascotas"] as const;
type ChipKey = (typeof CHIP_KEYS)[number];

function useUrlState() {
  const [params, setParams] = useSearchParams();

  const modo = (params.get("modo") || "comprar") as "comprar" | "rentar";
  const orden = (params.get("orden") as SortValue) || "relevance";
  const page = Math.max(1, parseInt(params.get("page") || "1"));
  const pp = Math.max(1, parseInt(params.get("pp") || "12"));
  const vista = (params.get("vista") || "lista") as "lista" | "mapa";

  const chips = new Set<ChipKey>(
    (params.get("chips") || "")
      .split(",")
      .map((s) => s.trim())
      .filter((x): x is ChipKey => (CHIP_KEYS as readonly string[]).includes(x)),
  );

  const setParam = (k: string, v?: string) => {
    const next = new URLSearchParams(params);
    if (v && v.length) next.set(k, v);
    else next.delete(k);
    if (k !== "page") next.set("page", "1");
    setParams(next, { replace: true });
  };

  const toggleChip = (key: ChipKey) => {
    const next = new URLSearchParams(params);
    const cur = new Set((params.get("chips") || "").split(",").filter(Boolean));
    if (cur.has(key)) cur.delete(key);
    else cur.add(key);
    const str = Array.from(cur).join(",");
    if (str) next.set("chips", str);
    else next.delete("chips");
    next.set("page", "1");
    setParams(next, { replace: true });
  };

  return { params, setParam, toggleChip, modo, orden, page, pp, vista, chips };
}

export default function SearchMenu({
  onOrden,
  onPageSize,
  onToggleVista,
}: {
  onOrden: (v: SortValue) => void;
  onPageSize: (n: number) => void;
  onToggleVista: (v: "lista" | "mapa") => void;
}) {
  const { modo, orden, pp, vista, chips, setParam, toggleChip } = useUrlState();

  useEffect(() => {
    onOrden(orden);
  }, [orden, onOrden]);
  useEffect(() => {
    onPageSize(pp);
  }, [pp, onPageSize]);
  useEffect(() => {
    onToggleVista(vista);
  }, [vista, onToggleVista]);

  const is = (k: ChipKey) => chips.has(k);

  return (
    <div className="sticky top-[4.5rem] z-30 bg-white/90 backdrop-blur border-b border-[color:var(--color-border)]">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
        {/* Modo comprar/rentar */}
        <div
          className="inline-flex rounded-2xl overflow-hidden border border-primary/40"
          role="tablist"
          aria-label="Modo de operación"
        >
          <button
            role="tab"
            aria-selected={modo === "comprar"}
            className={`px-4 py-2 text-sm md:text-base font-medium ${modo === "comprar" ? "bg-primary text-white" : "bg-white"}`}
            onClick={() => setParam("modo", "comprar")}
          >
            Comprar
          </button>
          <button
            role="tab"
            aria-selected={modo === "rentar"}
            className={`px-4 py-2 text-sm md:text-base font-medium ${modo === "rentar" ? "bg-primary text-white" : "bg-white"}`}
            onClick={() => setParam("modo", "rentar")}
          >
            Rentar
          </button>
        </div>

        {/* Chips rápidos */}
        <div className="flex flex-wrap items-center gap-2">
          {(CHIP_KEYS as ChipKey[]).map((k) => (
            <button
              key={k}
              aria-pressed={is(k)}
              onClick={() => toggleChip(k)}
              className={`inline-flex items-center rounded-2xl border px-3 py-1.5 text-sm ${is(k) ? "bg-primary text-white border-primary" : "border-primary/20 text-primary hover:bg-secondary/60"}`}
            >
              {k === "jardin" && "🌿"}
              {k === "alberca" && "🏊"}
              {k === "mascotas" && "🐾"} {k[0].toUpperCase() + k.slice(1)}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Vista */}
        <div
          className="inline-flex rounded-2xl overflow-hidden border border-primary/40"
          role="tablist"
          aria-label="Vista"
        >
          <button
            role="tab"
            aria-selected={vista === "lista"}
            className={`px-3 py-2 text-sm ${vista === "lista" ? "bg-primary text-white" : "bg-white"}`}
            onClick={() => setParam("vista", "lista")}
          >
            Lista
          </button>
          <button
            role="tab"
            aria-selected={vista === "mapa"}
            className={`px-3 py-2 text-sm ${vista === "mapa" ? "bg-primary text-white" : "bg-white"}`}
            onClick={() => setParam("vista", "mapa")}
          >
            Mapa
          </button>
        </div>

        {/* Guardar búsqueda (placeholder) */}
        <Button
          variant="secondary"
          aria-label="Guardar búsqueda"
          onClick={() => alert("Guardar búsqueda (por implementar)")}
        >
          Guardar búsqueda ★
        </Button>

        {/* Orden / page size */}
        <div className="flex items-center gap-2">
          <label className="text-sm">Orden:</label>
          <select className="select" value={orden} onChange={(e) => setParam("orden", e.target.value)}>
            <option value="relevance">Relevancia</option>
            <option value="price_asc">Precio ↑</option>
            <option value="price_desc">Precio ↓</option>
            <option value="area_asc">Área ↑</option>
            <option value="area_desc">Área ↓</option>
          </select>

          <label className="text-sm">Por página:</label>
          <select
            className="select w-[92px]"
            value={pp}
            onChange={(e) => setParam("pp", String(parseInt(e.target.value) || 12))}
          >
            <option>8</option>
            <option>12</option>
            <option>24</option>
            <option>48</option>
          </select>
        </div>
      </div>
    </div>
  );
}
