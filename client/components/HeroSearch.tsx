import { Button } from "@/components/ui/button";
import { Search, MapPin, Home } from "lucide-react";
import { useState } from "react";

export function HeroSearch() {
  const [searchType, setSearchType] = useState<"buy" | "rent">("buy");

  return (
    <section className="bg-gradient-to-br from-blue-50 to-blue-100 py-12 sm:py-20">
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
            onClick={() => setSearchType("buy")}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              searchType === "buy"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Comprar
          </button>
          <button
            onClick={() => setSearchType("rent")}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              searchType === "rent"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
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
                />
              </div>
            </div>

            {/* Property Type */}
            <div className="border border-gray-300 rounded-lg p-4 hover:border-blue-400 transition">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo de propiedad
              </label>
              <select className="w-full outline-none text-gray-800 bg-transparent">
                <option>Todos</option>
                <option>Casa</option>
                <option>Departamento</option>
                <option>Terreno</option>
                <option>Local comercial</option>
              </select>
            </div>

            {/* Price Range */}
            <div className="border border-gray-300 rounded-lg p-4 hover:border-blue-400 transition">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Precio
              </label>
              <select className="w-full outline-none text-gray-800 bg-transparent">
                <option>Cualquier precio</option>
                <option>Menos de $500K</option>
                <option>$500K - $1M</option>
                <option>$1M - $2M</option>
                <option>Más de $2M</option>
              </select>
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base">
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
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition text-sm"
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
