import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { usePaginatedProperties } from "../src/hooks/usePaginatedProperties";
import PropertySkeleton from "../src/components/properties/PropertySkeleton";
import PropertyCard from "../src/components/properties/PropertyCard";
import { useLocations } from "../src/hooks/useLocations";
import EstadoSelect from "@/components/EstadoSelect";
import MunicipioSelect from "@/components/MunicipioSelect";
import { loadLastSearch } from "../src/utils/searchState";
import Hero from "../src/components/Hero";
import SearchMenu from "../components/search/SearchMenu";
import DebugBoundary from "../components/DebugBoundary";
import FallbackPage from "../components/FallbackPage";
import { FeaturedListings } from "@/components/FeaturedListings";
import WhyChoose from "@/components/WhyChoose";
import SubscribeBanner from "@/components/SubscribeBanner";

export default function Buscar() {
  const { loading, error, states, findMunicipalities, normalize } =
    useLocations();
  const [params, setParams] = useSearchParams();
  const estado = params.get("estado") ?? "";
  const municipio = params.get("municipio") ?? "";
  const tipo = params.get("tipo") || "";
  const min = parseInt(params.get("min") || "");
  const maxParam = params.get("max");
  const max = maxParam ? parseInt(maxParam) : undefined;
  const modo = (params.get("modo") || "comprar").toLowerCase();
  const vista = (params.get("vista") || "lista").toLowerCase() as
    | "lista"
    | "mapa";
  const pp = Math.max(1, parseInt(params.get("pp") || "12"));
  const page = Math.max(1, parseInt(params.get("page") || "1"));
  const [orden, setOrden] = useState<
    "relevance" | "price_asc" | "price_desc" | "area_asc" | "area_desc"
  >("relevance");
  const [pageSize, setPageSize] = useState(pp);
  const [vistaState, setVista] = useState<"lista" | "mapa">(vista);
  console.info("[Buscar] mount");

  useEffect(() => {
    if ([...params.keys()].length === 0) {
      const last = loadLastSearch();
      if (last) {
        const next = new URLSearchParams();
        if (last.modo) next.set("modo", last.modo);
        if (last.estado) next.set("estado", last.estado);
        if (last.municipio) next.set("municipio", last.municipio);
        if (last.tipo) next.set("tipo", last.tipo);
        if (typeof last.min === "number") next.set("min", String(last.min));
        if (typeof last.max === "number") next.set("max", String(last.max));
        setParams(next, { replace: true });
      }
    }
  }, []);
  const [safeNote, setSafeNote] = useState<string>("");
  const SAFE_MODE = params.get("safe") === "1";
  console.info(
    "[Buscar] orden:",
    orden,
    "pageSize:",
    pageSize,
    "vista:",
    vistaState,
  );

  const municipalities = useMemo(
    () => (estado ? findMunicipalities(estado) : []),
    [estado, findMunicipalities],
  );

  const setEstado = (v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set("estado", v);
    else next.delete("estado");
    next.delete("municipio");
    setParams(next, { replace: true });
  };

  const setMunicipio = (v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set("municipio", v);
    else next.delete("municipio");
    setParams(next, { replace: true });
  };

  // cliente progresivo
  const baseQuery = useMemo(() => {
    const modo = (params.get("modo") || "comprar").toLowerCase() === "renta" ? "renta" : "comprar";
    const estadoQ = params.get("estado") || undefined;
    const municipioQ = params.get("municipio") || undefined;
    const tipoQ = params.get("tipo") || undefined;
    const minQ = params.get("min") ? Number(params.get("min")) : undefined;
    const maxQ = params.get("max") ? Number(params.get("max")) : undefined;
    const orderQ = (params.get("orden") as any) || undefined;
    return { modo, estado: estadoQ, municipio: municipioQ, tipo: tipoQ, min: minQ, max: maxQ, order: orderQ };
  }, [params]);

  const { items, total, hasNext, loading, loadMore, simulated } = usePaginatedProperties(baseQuery, 12);

  // filtros locales previos reemplazados por cliente remoto/progresivo

  return (
    <div className="max-w-5xl mx-auto bg-secondary/40 rounded-2xl p-0 md:p-0 space-y-8">
      <Hero />

      <DebugBoundary name="SearchMenu">
        {SAFE_MODE ? (
          <FallbackPage
            title="Kentra · Safe mode"
            note="SearchMenu desactivado por ?safe=1"
          />
        ) : (
          <SearchMenu
            onOrden={(v) => setOrden(v)}
            onPageSize={(n) => setPageSize(n)}
            onToggleVista={(v) => setVista(v)}
          />
        )}
      </DebugBoundary>

      {error && (
        <div className="p-3 rounded bg-red-50 border text-red-700">
          Error cargando ubicaciones: {String(error.message)}
        </div>
      )}

      <DebugBoundary name="Filtros">
        <div className="-mt-8 md:-mt-10 relative z-20">
          <div className="card bg-white rounded-2xl shadow-card p-6">
            <div className="mb-4">
              <div className="inline-flex rounded-2xl overflow-hidden border border-primary/40">
                <button
                  type="button"
                  className={`px-4 py-2 text-sm md:text-base font-medium ${params.get("operation") === "Sale" ? "bg-primary text-white" : "bg-white text-[color:var(--color-text)]"}`}
                  onClick={() => {
                    const n = new URLSearchParams(params);
                    n.set("operation", "Sale");
                    setParams(n, { replace: true });
                  }}
                >
                  Comprar
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 text-sm md:text-base font-medium ${params.get("operation") === "Rent" ? "bg-primary text-white" : "bg-white text-[color:var(--color-text)]"}`}
                  onClick={() => {
                    const n = new URLSearchParams(params);
                    n.set("operation", "Rent");
                    setParams(n, { replace: true });
                  }}
                >
                  Rentar
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EstadoSelect
                value={estado}
                onChange={setEstado}
                options={states}
                disabled={loading}
              />
              <MunicipioSelect
                value={municipio}
                onChange={setMunicipio}
                options={municipalities}
                disabled={!estado || loading}
              />
            </div>
            <div className="mt-4">
              <button
                type="button"
                className="btn btn-primary w-full md:w-auto"
              >
                Buscar
              </button>
            </div>
          </div>
        </div>
      </DebugBoundary>

      <DebugBoundary name="Resultados">
        <div className="pt-4">
          {simulated && (
            <div className="mb-3 text-amber-700 bg-amber-100 border border-amber-200 rounded-xl px-3 py-2 text-sm">
              Mostrando datos simulados (el servidor respondió 500).
            </div>
          )}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium">Resultados ({items.length}{total ? ` de ~${total}` : ""})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((p) => (
              <PropertyCard key={p.id} property={{
                id: String(p.id),
                title: p.title,
                price: p.price,
                state: p.state,
                municipality: p.municipality,
                type: p.type,
                image: p.image,
                badges: p.badges,
                createdAt: p.createdAt || null,
              }} />
            ))}
            {loading && Array.from({ length: 6 }).map((_, i) => (
              <PropertySkeleton key={`sk-${i}`} />
            ))}
          </div>
          <div className="flex justify-center mt-6">
            {hasNext ? (
              <button onClick={loadMore} disabled={loading} className="btn btn-secondary">
                {loading ? "Cargando…" : "Cargar más"}
              </button>
            ) : (
              !loading && items.length > 0 && (
                <span className="text-sm text-gray-600">Has visto todo ✨</span>
              )
            )}
          </div>
        </div>
      </DebugBoundary>

      <div className="mt-4 flex flex-wrap gap-2">
        {["Con jardín", "Con alberca", "Acepta mascotas"].map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center rounded-2xl border border-primary/20 px-3 py-1.5 text-sm text-primary hover:bg-secondary/60 cursor-pointer"
          >
            {chip}
          </span>
        ))}
      </div>

      <FeaturedListings />
      <WhyChoose />
      <SubscribeBanner />
    </div>
  );
}
