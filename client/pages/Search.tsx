import { useEffect, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listProperties } from "@shared/repo";
import { OperationOptions, PropertyTypeOptions, CurrencyOptions } from "@shared/options";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function getCurrencySymbol(value: string | undefined) {
  const found = CurrencyOptions.find((c) => c.value === value);
  return found?.symbol ?? "";
}

function toInt(v: string | null, def: number) {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : def;
}

function useFilters() {
  const [params, setParams] = useSearchParams();

  const page = toInt(params.get("page"), 1);
  const pageSize = toInt(params.get("pageSize"), 20);

  const q = params.get("q") || "";
  const operation = params.get("operation") || "";
  const type = params.get("type") || "";
  const priceMin = params.get("priceMin");
  const priceMax = params.get("priceMax");
  const status = params.get("status") || "Published";

  function set(next: Record<string, string | number | undefined | null>) {
    const nextParams = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") nextParams.delete(k);
      else nextParams.set(k, String(v));
    });
    setParams(nextParams, { replace: false });
  }

  return {
    filters: {
      q: q || undefined,
      operation: operation || undefined,
      type: type || undefined,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
      status: status || "Published",
    },
    page,
    pageSize,
    params,
    set,
  } as const;
}

export default function Search() {
  const { filters, page, pageSize, set, params } = useFilters();
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const query = useQuery({
    queryKey: ["properties", filters, page, pageSize],
    queryFn: () => listProperties(filters as any, page, pageSize),
  });

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    headingRef.current?.focus();
  }, [page, filters.q, filters.operation, filters.type, filters.priceMin, filters.priceMax, filters.status]);

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string }[] = [];
    if (filters.q) chips.push({ key: "q", label: `Texto: "${filters.q}"` });
    if (filters.operation) chips.push({ key: "operation", label: `Operación: ${filters.operation}` });
    if (filters.type) chips.push({ key: "type", label: `Tipo: ${filters.type}` });
    if (filters.priceMin || filters.priceMax) chips.push({ key: "price", label: `Precio: ${filters.priceMin ?? 0} - ${filters.priceMax ?? "∞"}` });
    if (filters.status) chips.push({ key: "status", label: `Estado: ${filters.status}` });
    return chips;
  }, [filters]);

  function clearParam(k: string) {
    if (k === "price") set({ priceMin: null, priceMax: null, page: 1 });
    else set({ [k]: null, page: 1 } as any);
  }

  function setPriceRange(key: "any" | "0-1M" | "1-3M" | "3M+") {
    if (key === "0-1M") set({ priceMin: null, priceMax: 1_000_000, page: 1 });
    else if (key === "1-3M") set({ priceMin: 1_000_000, priceMax: 3_000_000, page: 1 });
    else if (key === "3M+") set({ priceMin: 3_000_000, priceMax: null, page: 1 });
    else set({ priceMin: null, priceMax: null, page: 1 });
  }

  function goPage(p: number) {
    const next = Math.min(Math.max(1, p), totalPages);
    set({ page: next });
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        <section className="md:col-span-9 order-2 md:order-1">
          <h1 ref={headingRef} tabIndex={-1} className="text-xl font-semibold mb-2">
            {isLoading ? "Cargando..." : `${total} resultados`}
          </h1>
          <div className="flex flex-wrap gap-2 mb-4">
            {activeChips.map((c) => (
              <Badge key={c.key} variant="secondary" className="px-3 py-1 flex items-center gap-2">
                <span>{c.label}</span>
                <button type="button" aria-label={`Quitar ${c.key}`} onClick={() => clearParam(c.key)} className="text-sm">×</button>
              </Badge>
            ))}
          </div>

          {isLoading ? (
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
            <div className="text-center text-gray-600 py-16">No hay resultados</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((p) => (
                <article key={p.id} className="rounded-xl border overflow-hidden">
                  <img src={p.cover || "/placeholder.svg"} alt={p.title} className="w-full h-40 object-cover" />
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge>{p.operation}</Badge>
                      <Badge variant="outline">{p.type}</Badge>
                    </div>
                    <h3 className="font-semibold text-lg">{p.title}</h3>
                    <div className="text-blue-700 font-semibold">
                      {getCurrencySymbol(p.currency)} {p.price.toLocaleString()}
                    </div>
                    {p.address_text && <div className="text-sm text-gray-600">{p.address_text}</div>}
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Pagination */}
          <nav className="flex items-center justify-center gap-2 mt-6" aria-label="Paginación">
            <Button type="button" variant="outline" disabled={page <= 1} onClick={() => goPage(page - 1)}>Anterior</Button>
            {Array.from({ length: totalPages }).slice(0, 7).map((_, idx) => {
              const p = idx + 1;
              return (
                <Button key={p} type="button" variant={p === page ? "default" : "outline"} onClick={() => goPage(p)} aria-current={p === page ? "page" : undefined}>
                  {p}
                </Button>
              );
            })}
            <Button type="button" variant="outline" disabled={page >= totalPages} onClick={() => goPage(page + 1)}>Siguiente</Button>
          </nav>
        </section>

        {/* Sidebar Filters */}
        <aside className="md:col-span-3 order-1 md:order-2">
          <div className="rounded-xl border p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Búsqueda</label>
              <Input
                value={filters.q || ""}
                onChange={(e) => set({ q: e.target.value, page: 1 })}
                placeholder="Ciudad, colonia..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Operación</label>
              <select
                className="w-full border rounded h-10 px-2"
                value={filters.operation || ""}
                onChange={(e) => set({ operation: e.target.value || null, page: 1 })}
              >
                <option value="">Todas</option>
                {OperationOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label_es}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select
                className="w-full border rounded h-10 px-2"
                value={filters.type || ""}
                onChange={(e) => set({ type: e.target.value || null, page: 1 })}
              >
                <option value="">Todos</option>
                {PropertyTypeOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label_es}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Precio</label>
              <select
                className="w-full border rounded h-10 px-2"
                onChange={(e) => setPriceRange(e.target.value as any)}
                value={
                  filters.priceMin == null && filters.priceMax == null ? "any" :
                  filters.priceMin == null && (filters.priceMax ?? 0) <= 1_000_000 ? "0-1M" :
                  (filters.priceMin ?? 0) === 1_000_000 && (filters.priceMax ?? 0) === 3_000_000 ? "1-3M" :
                  "3M+"
                }
              >
                <option value="any">Cualquier</option>
                <option value="0-1M">0–1M</option>
                <option value="1-3M">1–3M</option>
                <option value="3M+">+3M</option>
              </select>
            </div>
          </div>
        </aside>
      </main>
      <Footer />
    </div>
  );
}
