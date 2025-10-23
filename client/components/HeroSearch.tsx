import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PropertyTypeOptions } from "@shared/options";
import { getPriceOptionsMXNByOperation } from "@shared/filters";
import { Search } from "lucide-react";

export function HeroSearch() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const persistedOp = (localStorage.getItem("imx_operation") as "Sale" | "Rent" | null) || (localStorage.getItem("imx_hero_op") as "Sale" | "Rent" | null) || null;
  const initialOp = (params.get("operation") as "Sale" | "Rent" | null) || persistedOp || "Sale";
  const [operation, setOperation] = useState<"Sale" | "Rent">(initialOp);
  const [typeValue, setTypeValue] = useState<string>("");
  const initialPriceKey = (localStorage.getItem("imx_priceRangeKey") as string | null) || "any";
  const [priceKey, setPriceKey] = useState<string>(initialPriceKey);

  useEffect(() => {
    const next = new URLSearchParams(params);
    next.set("operation", operation);
    next.set("status", "Published");
    setParams(next, { replace: true });
    localStorage.setItem("imx_operation", operation);
  }, [operation]);

  function doSearch() {
    const options = getPriceOptionsMXNByOperation(operation);
    const selected = options.find((o) => o.key === priceKey);
    const search = new URLSearchParams();
    search.set("operation", operation);
    search.set("status", "Published");
    if (typeValue) search.set("type", typeValue);
    if (selected?.priceMin != null) search.set("priceMin", String(selected.priceMin));
    if (selected?.priceMax != null) search.set("priceMax", String(selected.priceMax));
    navigate(`/search?${search.toString()}`);
  }

  function clearAll() {
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
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">Encuentra tu hogar ideal en México</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Explora casas, departamentos y más en todo el país.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-5">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2" role="tablist" aria-label="Operación" data-loc="HeroTabs">
              <button type="button" role="tab" aria-selected={operation === "Sale"}
                className={`px-4 py-2 rounded-full text-sm font-medium transition border ${operation === "Sale" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"}`}
                onClick={() => { setOperation("Sale"); setPriceKey("any"); localStorage.removeItem("imx_priceRangeKey"); }}>
                Comprar
              </button>
              <button type="button" role="tab" aria-selected={operation === "Rent"}
                className={`px-4 py-2 rounded-full text-sm font-medium transition border ${operation === "Rent" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"}`}
                onClick={() => { setOperation("Rent"); setPriceKey("any"); localStorage.removeItem("imx_priceRangeKey"); }}>
                Rentar
              </button>
              <div className="ml-auto hidden sm:block">
                <button type="button" onClick={clearAll} className="text-sm text-gray-600 hover:text-gray-900 underline" data-loc="HeroClear">Limpiar</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="w-full border rounded-xl px-3 py-2" data-loc="HeroType">
                <label htmlFor="hero-type" className="block text-xs font-medium text-gray-700">Tipo de propiedad</label>
                <select id="hero-type" className="w-full bg-transparent outline-none h-9" value={typeValue} onChange={(e) => setTypeValue(e.target.value)}>
                  <option value="">Todos</option>
                  {PropertyTypeOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label_es}</option>
                  ))}
                </select>
              </div>

              <div className="w-full border rounded-xl px-3 py-2" data-loc="HeroPrice">
                <label htmlFor="hero-price" className="block text-xs font-medium text-gray-700">Precio</label>
                <select id="hero-price" className="w-full bg-transparent outline-none h-9" value={priceKey}
                  onChange={(e) => { setPriceKey(e.target.value); localStorage.setItem("imx_priceRangeKey", e.target.value); }}>
                  {getPriceOptionsMXNByOperation(operation).map((o) => (
                    <option key={o.key} value={o.key}>{o.label}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">{operation === "Sale" ? "Montos en millones MXN" : "Montos mensuales en miles MXN"}</p>
              </div>

              <div className="relative md:static sticky bottom-2">
                <Button type="button" onClick={doSearch} className="w-full px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition h-11" data-loc="HeroSearchBtn">
                  <Search className="w-4 h-4 mr-2" /> Buscar
                </Button>
              </div>

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
