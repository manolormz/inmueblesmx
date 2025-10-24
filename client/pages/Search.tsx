import { useEffect, useMemo, useRef, useCallback, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listProperties } from "@shared/repo";
import { PropertyTypeOptions, CurrencyOptions } from "@shared/options";
import { formatPriceCompactMXN, getOptionLabelEs } from "@shared/formatters";
import { getPriceOptionsMXNByOperation } from "@shared/filters";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import SafeMapToggle from "@/components/SafeMapToggle";
import GeocoderInput from "@/components/GeocoderInput";
import SafePreview from "@/components/SafePreview";
import { useMapSearchSync } from "@/hooks/useMapSearchSync";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

function toInt(v: string | null, def: number) {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? n : def;
}

function useDebouncedCallback<T extends (...args: any[]) => void>(
  fn: T,
  delay = 300,
) {
  const ref = useRef<number | null>(null);
  return useCallback(
    (...args: any[]) => {
      if (ref.current) window.clearTimeout(ref.current);
      ref.current = window.setTimeout(() => fn(...args), delay);
    },
    [fn, delay],
  ) as T;
}

function useFilters() {
  const [params, setParams] = useSearchParams();

  // defaults
  if (!params.get("status")) {
    params.set("status", "Published");
    setParams(params, { replace: true });
  }

  const page = Math.max(1, toInt(params.get("page"), 1));
  const pageSize = Math.max(1, toInt(params.get("pageSize"), 20));

  const q = params.get("q") || "";
  const operation = params.get("operation") || "";
  const type = params.get("type") || "";
  const priceMin = params.get("priceMin");
  const priceMax = params.get("priceMax");
  const status = params.get("status") || "Published";
  const locationSlug = params.get("locationSlug") || "";
  const neighborhoodSlug = params.get("neighborhoodSlug") || "";

  const minBedrooms = params.get("minBedrooms");
  const minBathrooms = params.get("minBathrooms");
  const minParking = params.get("minParking");
  const builtMin = params.get("builtMin");
  const builtMax = params.get("builtMax");
  const landMin = params.get("landMin");
  const landMax = params.get("landMax");
  const currency = params.get("currency");
  const sort = params.get("sort") || "recent"; // recent | price_asc | price_desc | m2_desc

  function set(next: Record<string, string | number | undefined | null>) {
    const nextParams = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") nextParams.delete(k);
      else nextParams.set(k, String(v));
    });
    setParams(nextParams, { replace: false });
  }

  const filtersForRepo = {
    // si hay slugs de ubicación, no mezclar con q para evitar ruido
    q: locationSlug || neighborhoodSlug ? undefined : q || undefined,
    operation: operation || undefined,
    type: type || undefined,
    priceMin: priceMin ? Number(priceMin) : undefined,
    priceMax: priceMax ? Number(priceMax) : undefined,
    status: status || "Published",
    locationSlug: locationSlug || undefined,
    neighborhoodSlug: neighborhoodSlug || undefined,
    minBedrooms: minBedrooms ? Number(minBedrooms) : undefined,
    minBathrooms: minBathrooms ? Number(minBathrooms) : undefined,
    minParking: minParking ? Number(minParking) : undefined,
    builtMin: builtMin ? Number(builtMin) : undefined,
    builtMax: builtMax ? Number(builtMax) : undefined,
    landMin: landMin ? Number(landMin) : undefined,
    landMax: landMax ? Number(landMax) : undefined,
    currency: currency || undefined,
    ...(sort === "price_asc"
      ? { sortBy: "price", sortDir: "asc" as const }
      : sort === "price_desc"
        ? { sortBy: "price", sortDir: "desc" as const }
        : sort === "m2_desc"
          ? { sortBy: "built_m2", sortDir: "desc" as const }
          : { sortBy: "id", sortDir: "desc" as const }),
  } as const;

  return { params, set, page, pageSize, filtersForRepo } as const;
}

export default function Search() {
  const { params, set, page, pageSize, filtersForRepo } = useFilters();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [fitBbox, setFitBbox] = useState<string | undefined>(undefined);

  const baseParams = useMemo(
    () => ({
      operation: params.get("operation") || undefined,
      type: params.get("type") || undefined,
      minPrice: params.get("priceMin") || undefined,
      maxPrice: params.get("priceMax") || undefined,
      bedrooms: params.get("minBedrooms") || undefined,
      state: params.get("state") || undefined,
      municipality: params.get("municipality") || undefined,
      neighborhood: params.get("neighborhood") || undefined,
      text: params.get("q") || undefined,
      page: String(page),
      pageSize: String(pageSize),
    }),
    [params, page, pageSize],
  );

  const {
    search: apiSearch,
    setBbox,
    pendingBbox,
    applyPending,
    clearPending,
  } = useMapSearchSync(baseParams, { auto: false });

  const mapMarkers = useMemo(() => {
    const MAX_MARKERS = 500;
    let r = apiSearch.data?.results || [];
    if ((!r || r.length === 0) && (apiSearch.isError || !apiSearch.data)) {
      // Fallback mock cerca de CDMX
      const base = { lat: 19.4326, lng: -99.1332 };
      const count = 800;
      r = Array.from({ length: count }).map((_, i) => ({
        listing_id: `mock-${i + 1}`,
        lat: base.lat + (Math.random() - 0.5) * 0.6,
        lng: base.lng + (Math.random() - 0.5) * 0.6,
        title: `Propiedad mock ${i + 1}`,
        property_slug: `mock-${i + 1}`,
      }));
    }
    return r
      .filter(
        (it: any) =>
          Number.isFinite(Number(it?.lat)) && Number.isFinite(Number(it?.lng)),
      )
      .slice(0, MAX_MARKERS)
      .map((it: any) => ({
        id: it.listing_id,
        lat: Number(it.lat),
        lng: Number(it.lng),
        title: it.title || it.property_slug,
      }));
  }, [apiSearch.data, apiSearch.isError]);

  const query = useQuery({
    queryKey: ["properties", filtersForRepo, page, pageSize],
    queryFn: () => listProperties(filtersForRepo as any, page, pageSize),
  });

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const forceMock =
    new URLSearchParams(window.location.search).get("mock") === "1";
  const hasReal = !!apiSearch.data && !apiSearch.isError;
  const selectedResults: any[] | undefined = forceMock
    ? undefined
    : hasReal
      ? (apiSearch.data?.results as any[])
      : undefined;
  const selectedTotal = forceMock
    ? total
    : hasReal
      ? (apiSearch.data?.total ?? 0)
      : total;

  useEffect(() => {
    headingRef.current?.focus();
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {}
  }, [page, params.toString()]);

  const qValue = params.get("q") || "";
  const setQDebounced = useDebouncedCallback(
    (val: string) => set({ q: val || null, page: 1 }),
    300,
  );

  const opParam =
    (params.get("operation") as "Sale" | "Rent" | null) ||
    (localStorage.getItem("imx_operation") as "Sale" | "Rent" | null) ||
    "Sale";
  const priceOptions = useMemo(
    () => getPriceOptionsMXNByOperation(opParam),
    [opParam],
  );

  // Clear stored price key when operation changes, to reset selection
  const opRef = useRef<string | null>(null);
  if (opRef.current !== opParam) {
    localStorage.removeItem("imx_priceRangeKey");
    opRef.current = opParam;
  }

  const priceKey = useMemo(() => {
    const min = params.get("priceMin");
    const max = params.get("priceMax");
    const match = priceOptions.find(
      (o) =>
        String(o.priceMin ?? "") === String(min ?? "") &&
        String(o.priceMax ?? "") === String(max ?? ""),
    );
    return match?.key || "any";
  }, [params, priceOptions]);

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string }[] = [];
    const lastLoc = (() => {
      try {
        return JSON.parse(localStorage.getItem("imx_last_location") || "null");
      } catch {
        return null;
      }
    })();
    const locSlug = params.get("locationSlug");
    const neighSlug = params.get("neighborhoodSlug");
    // Ubicación removida
    if (qValue) chips.push({ key: "q", label: `Texto: "${qValue}"` });
    const op = opParam;
    if (params.get("operation"))
      chips.push({
        key: "operation",
        label: `Operación: ${getOptionLabelEs("Operation", op as any)}`,
      });
    const tp = params.get("type");
    if (tp)
      chips.push({
        key: "type",
        label: `Tipo: ${getOptionLabelEs("PropertyType", tp as any)}`,
      });
    const pmin = params.get("priceMin"),
      pmax = params.get("priceMax");
    if (pmin || pmax) {
      const match = priceOptions.find(
        (o) =>
          String(o.priceMin ?? "") === String(pmin ?? "") &&
          String(o.priceMax ?? "") === String(pmax ?? ""),
      );
      chips.push({
        key: "price",
        label: match ? match.label : `Precio: ${pmin ?? 0} - ${pmax ?? "∞"}`,
      });
    }
    const beds = params.get("minBedrooms");
    if (beds) chips.push({ key: "minBedrooms", label: `Recámaras: ${beds}+` });
    const baths = params.get("minBathrooms");
    if (baths) chips.push({ key: "minBathrooms", label: `Baños: ${baths}+` });
    const park = params.get("minParking");
    if (park) chips.push({ key: "minParking", label: `Estac.: ${park}+` });
    const bmin = params.get("builtMin"),
      bmax = params.get("builtMax");
    if (bmin || bmax)
      chips.push({
        key: "built",
        label: `Construcción: ${bmin ?? 0}–${bmax ?? "∞"} m²`,
      });
    const lmin = params.get("landMin"),
      lmax = params.get("landMax");
    if (lmin || lmax)
      chips.push({
        key: "land",
        label: `Terreno: ${lmin ?? 0}–${lmax ?? "∞"} m²`,
      });
    const curr = params.get("currency");
    if (curr) chips.push({ key: "currency", label: `Moneda: ${curr}` });
    return chips;
  }, [params, priceOptions, opParam, qValue]);

  function clearChip(k: string) {
    if (k === "price") {
      set({ priceMin: null, priceMax: null, page: 1 });
      localStorage.removeItem("imx_priceRangeKey");
    } else if (k === "built") set({ builtMin: null, builtMax: null, page: 1 });
    else if (k === "land") set({ landMin: null, landMax: null, page: 1 });
    else if (k === "locationSlug")
      set({ locationSlug: null, neighborhoodSlug: null, page: 1 });
    else if (k === "neighborhoodSlug") set({ neighborhoodSlug: null, page: 1 });
    else set({ [k]: null, page: 1 } as any);
  }

  function resetAll() {
    const keepStatus = params.get("status") || "Published";
    localStorage.removeItem("imx_priceRangeKey");
    set({
      q: null,
      operation: null,
      type: null,
      priceMin: null,
      priceMax: null,
      minBedrooms: null,
      minBathrooms: null,
      minParking: null,
      builtMin: null,
      builtMax: null,
      landMin: null,
      landMax: null,
      currency: null,
      sort: null,
      page: 1,
      status: keepStatus,
    } as any);
  }

  function goPage(p: number) {
    const next = Math.min(Math.max(1, p), totalPages);
    set({ page: next });
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <SafePreview>
        {/* Sticky filter bar */}
        <div
          className="sticky top-16 z-40 bg-white/90 backdrop-blur border-b"
          data-loc="SearchBar"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              {/* Tipo */}
              <div className="md:col-span-2 w-full border rounded-xl px-3 py-2">
                <label
                  htmlFor="type"
                  className="block text-xs font-medium text-gray-700"
                >
                  Tipo
                </label>
                <select
                  id="type"
                  className="w-full bg-transparent outline-none h-9"
                  value={params.get("type") || ""}
                  onChange={(e) =>
                    set({ type: e.target.value || null, page: 1 })
                  }
                >
                  <option value="">Todos</option>
                  {PropertyTypeOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label_es}
                    </option>
                  ))}
                </select>
              </div>

              {/* Precio */}
              <div className="md:col-span-2 w-full border rounded-xl px-3 py-2">
                <label
                  htmlFor="price"
                  className="block text-xs font-medium text-gray-700"
                >
                  Precio
                </label>
                <select
                  id="price"
                  name="price"
                  className="w-full bg-transparent outline-none h-9"
                  value={priceKey}
                  onChange={(e) => {
                    const key = e.target.value;
                    const selected = priceOptions.find((o) => o.key === key);
                    localStorage.setItem("imx_priceRangeKey", key);
                    set({
                      priceMin: selected?.priceMin ?? null,
                      priceMax: selected?.priceMax ?? null,
                      page: 1,
                    });
                  }}
                >
                  {priceOptions.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {opParam === "Sale"
                    ? "Montos en millones MXN"
                    : "Montos mensuales en miles MXN"}
                </p>
              </div>

              {/* Más filtros */}
              <div className="md:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11"
                  onClick={() => setModalOpen(true)}
                  data-loc="SearchMoreFiltersBtn"
                >
                  Más filtros
                </Button>
              </div>

              {/* Ordenar */}
              <div className="md:col-span-2">
                <label
                  htmlFor="order"
                  className="block text-xs font-medium text-gray-700"
                >
                  Ordenar por
                </label>
                <select
                  id="order"
                  name="order"
                  className="w-full border rounded-xl h-11 px-3"
                  value={params.get("sort") || "recent"}
                  onChange={(e) => set({ sort: e.target.value, page: 1 })}
                  data-loc="SearchOrder"
                >
                  <option value="recent">Más recientes</option>
                  <option value="price_asc">Precio ascendente</option>
                  <option value="price_desc">Precio descendente</option>
                  <option value="m2_desc">Metros cuadrados</option>
                </select>
              </div>
            </div>

            {/* Chips */}
            <div className="flex flex-wrap gap-2 mt-3" data-loc="SearchChips">
              {activeChips.map((c) => (
                <Badge
                  key={c.key}
                  variant="secondary"
                  className="px-3 py-1 flex items-center gap-2"
                >
                  <span>{c.label}</span>
                  <button
                    type="button"
                    aria-label={`Quitar ${c.key}`}
                    onClick={() => clearChip(c.key)}
                    className="text-sm"
                  >
                    ×
                  </button>
                </Badge>
              ))}
              {activeChips.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetAll}
                  data-loc="SearchResetAll"
                >
                  Restablecer todo
                </Button>
              )}
            </div>
          </div>
        </div>

        {!new URLSearchParams(window.location.search).get("mock") &&
          apiSearch.isError && (
            <div className="container mx-auto px-4 mt-2">
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                Mostrando datos simulados (el servidor respondió 500).
              </div>
            </div>
          )}

        <section className="container mx-auto px-4 mt-4 relative">
          <SafeMapToggle
            onBoundsChange={setBbox}
            markers={mapMarkers}
            initialCenter={{ lat: 19.4326, lng: -99.1332 }}
            initialZoom={11}
            controls={
              <div className="flex gap-2 items-center">
                <GeocoderInput
                  onPick={(f) => {
                    const bbox =
                      f.bbox && f.bbox.length === 4
                        ? `${f.bbox[0]},${f.bbox[1]},${f.bbox[2]},${f.bbox[3]}`
                        : `${f.center[0] - 0.02},${f.center[1] - 0.02},${f.center[0] + 0.02},${f.center[1] + 0.02}`;
                    set({ q: f.place_name, page: 1 });
                    setBbox(bbox);
                    setFitBbox(bbox);
                  }}
                />
                {pendingBbox && (
                  <>
                    <Button
                      type="button"
                      onClick={applyPending}
                      className="bg-white"
                    >
                      Buscar en esta área
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearPending}
                      className="bg-white"
                    >
                      Cancelar
                    </Button>
                  </>
                )}
              </div>
            }
          />
        </section>

        <main className="container mx-auto px-4 py-6">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-xl font-semibold mb-4"
          >
            {apiSearch.isFetching || query.isLoading
              ? "Cargando..."
              : `Resultados (${selectedTotal})`}
          </h1>

          {query.isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border p-4">
                  <div className="h-40 bg-gray-200 rounded mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center text-gray-600 py-16 space-y-3">
              <div>No encontramos resultados con tus filtros…</div>
              <div className="flex items-center justify-center gap-2">
                <Button type="button" onClick={resetAll}>
                  Limpiar filtros
                </Button>
                <Link className="text-blue-600 underline" to="/">
                  Volver al inicio
                </Link>
              </div>
            </div>
          ) : (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              data-loc="SearchCard"
            >
              {(selectedResults as any[] | undefined)?.length
                ? (selectedResults as any[]).map((p: any) => (
                    <article
                      key={p.listing_id}
                      className="rounded-xl border overflow-hidden"
                    >
                      <a
                        href={`/property/${p.property_slug || p.slug}`}
                        className="block focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <img
                          src={(p.cover_url || p.cover) ?? "/placeholder.svg"}
                          alt={p.title || p.property_slug}
                          className="w-full h-40 object-cover"
                        />
                        <div className="p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge>{p.operation}</Badge>
                            <Badge variant="outline">
                              {p.property_type || p.type}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-lg">
                            {p.title || p.property_slug}
                          </h3>
                          <div className="text-blue-700 font-semibold">
                            {typeof p.price === "number"
                              ? Intl.NumberFormat("es-MX", {
                                  style: "currency",
                                  currency: p.currency || "MXN",
                                  maximumFractionDigits: 0,
                                }).format(p.price)
                              : formatPriceCompactMXN(
                                  p.price,
                                  p.operation === "Rent" ? "Rent" : "Sale",
                                )}
                          </div>
                          {p.address_text && (
                            <div className="text-sm text-gray-600">
                              {p.address_text}
                            </div>
                          )}
                        </div>
                      </a>
                      <div className="px-4 pb-4 flex gap-2">
                        <a
                          className="px-3 py-2 rounded-md border text-sm"
                          href={
                            p.listing_id
                              ? `/lead?listingId=${p.listing_id}`
                              : "#"
                          }
                          aria-disabled={!p.listing_id}
                          title={!p.listing_id ? "Falta ID" : undefined}
                          onClick={(e) => {
                            if (!p.listing_id) {
                              e.preventDefault();
                              return;
                            }
                            import("@/services/analytics").then((m) =>
                              m.track("cta_lead_click", { id: p.listing_id }),
                            );
                          }}
                        >
                          Estoy interesado
                        </a>
                        <a
                          className="px-3 py-2 rounded-md border text-sm"
                          href={
                            p.listing_id
                              ? `/visita?listingId=${p.listing_id}`
                              : "#"
                          }
                          aria-disabled={!p.listing_id}
                          title={!p.listing_id ? "Falta ID" : undefined}
                          onClick={(e) => {
                            if (!p.listing_id) {
                              e.preventDefault();
                              return;
                            }
                            import("@/services/analytics").then((m) =>
                              m.track("cta_visit_click", { id: p.listing_id }),
                            );
                          }}
                        >
                          Agendar visita
                        </a>
                      </div>
                    </article>
                  ))
                : items.map((p) => (
                    <article
                      key={p.id}
                      className="rounded-xl border overflow-hidden"
                    >
                      <a
                        href={`/property/${p.slug}`}
                        className="block focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <img
                          src={p.cover || "/placeholder.svg"}
                          alt={p.title}
                          className="w-full h-40 object-cover"
                        />
                        <div className="p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge>{p.operation}</Badge>
                            <Badge variant="outline">{p.type}</Badge>
                          </div>
                          <h3 className="font-semibold text-lg">{p.title}</h3>
                          <div className="text-blue-700 font-semibold">
                            {formatPriceCompactMXN(
                              p.price,
                              p.operation === "Rent" ? "Rent" : "Sale",
                            )}
                          </div>
                          {p.address_text && (
                            <div className="text-sm text-gray-600">
                              {p.address_text}
                            </div>
                          )}
                        </div>
                      </a>
                      <div className="px-4 pb-4 flex gap-2">
                        <a
                          className="px-3 py-2 rounded-md border text-sm"
                          href={p.id ? `/lead?listingId=${p.id}` : "#"}
                          aria-disabled={!p.id}
                          title={!p.id ? "Falta ID" : undefined}
                          onClick={(e) => {
                            if (!p.id) {
                              e.preventDefault();
                              return;
                            }
                            import("@/services/analytics").then((m) =>
                              m.track("cta_lead_click", { id: p.id }),
                            );
                          }}
                        >
                          Estoy interesado
                        </a>
                        <a
                          className="px-3 py-2 rounded-md border text-sm"
                          href={p.id ? `/visita?listingId=${p.id}` : "#"}
                          aria-disabled={!p.id}
                          title={!p.id ? "Falta ID" : undefined}
                          onClick={(e) => {
                            if (!p.id) {
                              e.preventDefault();
                              return;
                            }
                            import("@/services/analytics").then((m) =>
                              m.track("cta_visit_click", { id: p.id }),
                            );
                          }}
                        >
                          Agendar visita
                        </a>
                      </div>
                    </article>
                  ))}
            </div>
          )}

          {/* Pagination */}
          <nav
            className="flex items-center justify-center gap-2 mt-6"
            aria-label="Paginación"
            data-loc="SearchPagination"
          >
            <Button
              type="button"
              variant="outline"
              disabled={page <= 1}
              aria-disabled={page <= 1}
              onClick={() => goPage(page - 1)}
            >
              Anterior
            </Button>
            {Array.from({ length: totalPages })
              .slice(0, 7)
              .map((_, idx) => {
                const p = idx + 1;
                return (
                  <Button
                    key={p}
                    type="button"
                    variant={p === page ? "default" : "outline"}
                    onClick={() => goPage(p)}
                    aria-current={p === page ? "page" : undefined}
                  >
                    {p}
                  </Button>
                );
              })}
            <Button
              type="button"
              variant="outline"
              disabled={page >= totalPages}
              aria-disabled={page >= totalPages}
              onClick={() => goPage(page + 1)}
            >
              Siguiente
            </Button>
          </nav>
        </main>
      </SafePreview>

      <Footer />

      {/* More Filters Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Más filtros</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Recámaras */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Recámaras
              </label>
              <select
                className="w-full border rounded h-10 px-2"
                defaultValue={params.get("minBedrooms") || ""}
                onChange={(e) =>
                  set({ minBedrooms: e.target.value || null, page: 1 })
                }
              >
                <option value="">Cualquiera</option>
                {Array.from({ length: 6 }).map((_, i) => (
                  <option key={i} value={i === 5 ? 5 : i}>
                    {i === 5 ? "5+" : i}
                  </option>
                ))}
              </select>
            </div>

            {/* Baños */}
            <div>
              <label className="block text-sm font-medium mb-1">Baños</label>
              <select
                className="w-full border rounded h-10 px-2"
                defaultValue={params.get("minBathrooms") || ""}
                onChange={(e) =>
                  set({ minBathrooms: e.target.value || null, page: 1 })
                }
              >
                <option value="">Cualquiera</option>
                {Array.from({ length: 6 }).map((_, i) => (
                  <option key={i} value={i === 5 ? 5 : i}>
                    {i === 5 ? "5+" : i}
                  </option>
                ))}
              </select>
            </div>

            {/* Estacionamiento */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Estacionamiento
              </label>
              <select
                className="w-full border rounded h-10 px-2"
                defaultValue={params.get("minParking") || ""}
                onChange={(e) =>
                  set({ minParking: e.target.value || null, page: 1 })
                }
              >
                <option value="">Cualquiera</option>
                {Array.from({ length: 5 }).map((_, i) => (
                  <option key={i} value={i === 4 ? 4 : i}>
                    {i === 4 ? "4+" : i}
                  </option>
                ))}
              </select>
            </div>

            {/* Construcción m2 */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Construcción (m²)
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="Mín"
                  defaultValue={params.get("builtMin") || ""}
                  onChange={(e) =>
                    set({ builtMin: e.target.value || null, page: 1 })
                  }
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="Máx"
                  defaultValue={params.get("builtMax") || ""}
                  onChange={(e) =>
                    set({ builtMax: e.target.value || null, page: 1 })
                  }
                />
              </div>
            </div>

            {/* Terreno m2 */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Terreno (m²)
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="Mín"
                  defaultValue={params.get("landMin") || ""}
                  onChange={(e) =>
                    set({ landMin: e.target.value || null, page: 1 })
                  }
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="Máx"
                  defaultValue={params.get("landMax") || ""}
                  onChange={(e) =>
                    set({ landMax: e.target.value || null, page: 1 })
                  }
                />
              </div>
            </div>

            {/* Moneda */}
            <div>
              <label className="block text-sm font-medium mb-1">Moneda</label>
              <select
                className="w-full border rounded h-10 px-2"
                defaultValue={params.get("currency") || ""}
                onChange={(e) =>
                  set({ currency: e.target.value || null, page: 1 })
                }
              >
                <option value="">Cualquiera</option>
                {CurrencyOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <div className="flex w-full justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => resetAll()}
                data-loc="SearchResetAll"
              >
                Limpiar
              </Button>
              <Button
                type="button"
                onClick={() => setModalOpen(false)}
                data-loc="SearchApply"
              >
                Aplicar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
