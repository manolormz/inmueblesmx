import { Search, MapPin } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PropertyTypeOptions } from "@shared/options";
import { getPriceOptionsMXNByOperation } from "@shared/filters";

export function HeroSearch() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  // Load persisted operation from URL or localStorage
  const persistedOp = (localStorage.getItem("imx_operation") as "Sale" | "Rent" | null) || (localStorage.getItem("imx_hero_op") as "Sale" | "Rent" | null) || null;
  const initialOp = (params.get("operation") as "Sale" | "Rent" | null) || persistedOp || "Sale";
  const [operation, setOperation] = useState<"Sale" | "Rent">(initialOp);
  const [q, setQ] = useState("");
  const [typeValue, setTypeValue] = useState<string>("");
  const initialPriceKey = (localStorage.getItem("imx_priceRangeKey") as string | null) || "any";
  const [priceKey, setPriceKey] = useState<string>(initialPriceKey);

  const helpId = useMemo(() => `hero-help-${Math.random().toString(36).slice(2)}`, []);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    const next = new URLSearchParams(params);
    if (operation) next.set("operation", operation);
    next.set("status", "Published");
    setParams(next, { replace: true });
    localStorage.setItem("imx_operation", operation);
  }, [operation]);

  const debouncedSetQ = useCallback((val: string) => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setQ(val);
    }, 300);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") doSearch();
    else if (e.key === "Escape") {
      setQ("");
      inputRef.current?.focus();
    }
  };

  function doSearch() {
    const options = getPriceOptionsMXNByOperation(operation);
    const selected = options.find((o) => o.key === priceKey);
    const search = new URLSearchParams();
    if (operation) search.set("operation", operation);
    search.set("status", "Published");
    if (q.trim()) search.set("q", q.trim());
    if (typeValue) search.set("type", typeValue);
    if (selected?.priceMin != null) search.set("priceMin", String(selected.priceMin));
    if (selected?.priceMax != null) search.set("priceMax", String(selected.priceMax));
    navigate(`/search?${search.toString()}`);
  }

  function clearAll() {
    setQ("");
    setTypeValue("");
    setPriceKey("any");
    setOperation("Sale");
    localStorage.removeItem("imx_priceRangeKey");
    localStorage.setItem("imx_operation", "Sale");
    const next = new URLSearchParams();
    next.set("status", "Published");
    next.set("operation", "Sale");
    setParams(next, { replace: true });
  }

  return (
    <section className="bg-gradient-to-br from-blue-50 to-blue-100 py-10 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
            Encuentra tu hogar ideal en México
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Millones de propiedades disponibles. Explora casas, departamentos y más en todo el país.
          </p>
        </div>

        {/* Tabs + Controls line */}
        <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-5">
          <div className="flex flex-col gap-3">
            {/* Operación tabs */}
            <div className="flex gap-2" role="tablist" aria-label="Operación" data-loc="HeroTabs">
              <button
                type="button"
                role="tab"
                aria-selected={operation === "Sale"}
                className={`px-4 py-2 rounded-full text-sm font-medium transition border ${operation === "Sale" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"}`}
                onClick={() => { setOperation("Sale"); setPriceKey("any"); localStorage.removeItem("imx_priceRangeKey"); }}
              >
                Comprar
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={operation === "Rent"}
                className={`px-4 py-2 rounded-full text-sm font-medium transition border ${operation === "Rent" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"}`}
                onClick={() => { setOperation("Rent"); setPriceKey("any"); localStorage.removeItem("imx_priceRangeKey"); }}
              >
                Rentar
              </button>
              <div className="ml-auto hidden sm:block">
                <button type="button" onClick={clearAll} className="text-sm text-gray-600 hover:text-gray-900 underline" data-loc="HeroClear">Limpiar</button>
              </div>
            </div>

            {/* Inputs row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              {/* Ubicación */}
              <div className="w-full border rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-500 relative" data-loc="HeroLocation">
                <label htmlFor="hero-q" className="block text-xs font-medium text-gray-700">Ubicación</label>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <input
                    id="hero-q"
                    ref={inputRef}
                    type="text"
                    placeholder="Ciudad, estado o código"
                    className="w-full bg-transparent outline-none placeholder-gray-500"
                    aria-describedby={helpId}
                    onChange={(e) => handleLocationInput(e.target.value)}
                    onKeyDown={handleLocationKey}
                    autoComplete="off"
                    data-loc="HeroLocationInput"
                  />
                </div>
                {/* Autocomplete dropdown */}
                {locOpen && (
                  <ul className="absolute z-30 mt-1 left-0 right-0 bg-white border rounded-xl shadow-lg max-h-56 overflow-auto" role="listbox" data-loc="HeroLocationList">
                    {locItems.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-gray-500">Sin resultados</li>
                    ) : (
                      locItems.map((it, idx) => (
                        <li key={it.slug}
                            role="option"
                            aria-selected={idx === locActive}
                            className={`px-3 py-2 cursor-pointer flex items-center justify-between ${idx===locActive?"bg-blue-50":"hover:bg-gray-50"}`}
                            onMouseEnter={() => setLocActive(idx)}
                            onMouseDown={(e) => { e.preventDefault(); selectLocation(it); }}
                            data-loc="HeroLocationItem"
                        >
                          <span className="font-medium">{it.name}</span>
                          <span className="ml-2 text-xs text-gray-500 px-2 py-0.5 rounded-full border">
                            {it.type === 'city' ? 'Ciudad' : it.type === 'state' ? 'Estado' : it.type === 'neighborhood' ? 'Colonia' : 'Metro'}
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                )}
                <p id={helpId} className="sr-only">Presiona Enter para seleccionar. Escape para cerrar.</p>
              </div>

              {/* Tipo */}
              <div className="w-full border rounded-xl px-3 py-2" data-loc="HeroType">
                <label htmlFor="hero-type" className="block text-xs font-medium text-gray-700">Tipo de propiedad</label>
                <select
                  id="hero-type"
                  className="w-full bg-transparent outline-none h-9"
                  value={typeValue}
                  onChange={(e) => setTypeValue(e.target.value)}
                >
                  <option value="">Todos</option>
                  {PropertyTypeOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label_es}</option>
                  ))}
                </select>
              </div>

              {/* Precio */}
              <div className="w-full border rounded-xl px-3 py-2" data-loc="HeroPrice">
                <label htmlFor="hero-price" className="block text-xs font-medium text-gray-700">Precio</label>
                <select
                  id="hero-price"
                  className="w-full bg-transparent outline-none h-9"
                  value={priceKey}
                  onChange={(e) => { setPriceKey(e.target.value); localStorage.setItem("imx_priceRangeKey", e.target.value); }}
                >
                  {getPriceOptionsMXNByOperation(operation).map((o) => (
                    <option key={o.key} value={o.key}>{o.label}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">{operation === "Sale" ? "Montos en millones MXN" : "Montos mensuales en miles MXN"}</p>
              </div>

              {/* Buscar */}
              <div className="relative md:static sticky bottom-2">
                <Button type="button" onClick={doSearch} className="w-full px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition h-11" data-loc="HeroSearchBtn">
                  <Search className="w-4 h-4 mr-2" /> Buscar
                </Button>
              </div>

              {/* Mobile clear */}
              <div className="md:hidden">
                <button type="button" onClick={clearAll} className="mt-1 text-sm text-gray-600 underline" data-loc="HeroClear">Limpiar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
