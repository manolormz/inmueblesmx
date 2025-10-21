import { Search, MapPin, Home } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PropertyTypeOptions } from "@shared/options";

export function HeroSearch() {
  const [searchType, setSearchType] = useState<"buy" | "rent">("buy");
  const [q, setQ] = useState("");
  const [typeValue, setTypeValue] = useState<string>("");
  const [priceKey, setPriceKey] = useState<"any" | "0-1M" | "1-3M" | "3M+">("any");
  const navigate = useNavigate();

  function priceParams(key: "any" | "0-1M" | "1-3M" | "3M+") {
    if (key === "0-1M") return { priceMax: 1_000_000 } as const;
    if (key === "1-3M") return { priceMin: 1_000_000, priceMax: 3_000_000 } as const;
    if (key === "3M+") return { priceMin: 3_000_000 } as const;
    return {} as const;
  }

  function toQuery(params: Record<string, string | number | undefined>) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") search.set(k, String(v));
    });
    return `?${search.toString()}`;
  }

  const navigateToSale = () => {
    const params = { operation: "Sale", status: "Published" };
    console.log("click Comprar", params);
    navigate(`/search${toQuery(params)}`);
  };

  const navigateToRent = () => {
    const params = { operation: "Rent", status: "Published" };
    console.log("click Rentar", params);
    navigate(`/search${toQuery(params)}`);
  };

  const handleHeroSearch = () => {
    const pp = priceParams(priceKey);
    const params: Record<string, string | number | undefined> = {
      q: q || undefined,
      type: typeValue || undefined,
      status: "Published",
      ...pp,
    };
    console.log("click Buscar", params);
    navigate(`/search${toQuery(params)}`);
  };

  return (
    <section className="bg-gradient-to-br from-blue-50 to-blue-100 py-12 sm:py-20" data-loc="client/components/HeroSearch.tsx:54:5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Encuentra tu hogar ideal en México
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Millones de propiedades disponibles. Explora casas, departamentos y
            más en todo el país.
          </p>
        </div>

        {/* Search Type Toggle */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            type="button"
            onClick={navigateToSale}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              searchType === "buy"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
            data-loc="HeroSearch"
          >
            Comprar
          </button>
          <button
            type="button"
            onClick={navigateToRent}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              searchType === "rent"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
            data-loc="HeroSearch"
          >
            Rentar
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Location */}
            <div className="border border-gray-300 rounded-lg p-4 hover:border-blue-400 transition">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ubicación
              </label>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ciudad, estado o código postal"
                  className="flex-1 outline-none text-gray-800 placeholder-gray-500"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
            </div>

            {/* Property Type */}
            <div className="border border-gray-300 rounded-lg p-4 hover:border-blue-400 transition">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo de propiedad
              </label>
              <select
                className="w-full outline-none text-gray-800 bg-transparent"
                value={typeValue}
                onChange={(e) => setTypeValue(e.target.value)}
              >
                <option value="">Todos</option>
                {PropertyTypeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label_es}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="border border-gray-300 rounded-lg p-4 hover:border-blue-400 transition">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Precio
              </label>
              <select
                className="w-full outline-none text-gray-800 bg-transparent"
                value={priceKey}
                onChange={(e) => setPriceKey(e.target.value as any)}
              >
                <option value="any">Cualquier</option>
                <option value="0-1M">0–1M</option>
                <option value="1-3M">1–3M</option>
                <option value="3M+">+3M</option>
              </select>
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <Button type="button" onClick={handleHeroSearch} className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base" data-loc="HeroSearch">
                <Search className="w-5 h-5 mr-2" />
                Buscar
              </Button>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Búsquedas populares:
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "CDMX",
                "Guadalajara",
                "Monterrey",
                "Playa del Carmen",
                "Cancún",
              ].map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => navigate(`/search?status=Published&q=${encodeURIComponent(city)}`)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition text-sm"
                  data-loc="HeroSearch"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
