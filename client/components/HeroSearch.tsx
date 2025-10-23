import { useState } from "react";
import SearchButton from "@/components/SearchButton";

export default function HeroSearch() {
  const [operation, setOperation] = useState("buy");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const propertyType = (form.get("type") || "").toString().trim();
    const priceMin = (form.get("priceMin") || "").toString().trim();
    const priceMax = (form.get("priceMax") || "").toString().trim();

    const params = new URLSearchParams();
    params.set("operation", operation);
    if (propertyType) params.set("type", propertyType);
    if (priceMin) params.set("priceMin", priceMin);
    if (priceMax) params.set("priceMax", priceMax);

    window.location.href = `/search?${params.toString()}`;
  }

  return (
    <div className="w-full flex flex-col items-center text-center">
      <div className="flex gap-3 justify-center mb-4">
        <button
          type="button"
          className={`px-5 py-2 rounded-lg border ${operation === "buy"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 border-gray-300"
            }`}
          onClick={() => setOperation("buy")}
        >
          Comprar
        </button>
        <button
          type="button"
          className={`px-5 py-2 rounded-lg border ${operation === "rent"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 border-gray-300"
            }`}
          onClick={() => setOperation("rent")}
        >
          Rentar
        </button>
        <button
          type="button"
          className={`px-5 py-2 rounded-lg border ${operation === "sell"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 border-gray-300"
            }`}
          onClick={() => setOperation("sell")}
        >
          Vender
        </button>
      </div>

      <form
        onSubmit={onSubmit}
        className="bg-white shadow-md rounded-xl p-4 flex flex-col md:flex-row items-center gap-3 w-full max-w-4xl"
      >
        <select
          name="type"
          className="border rounded-lg p-2 w-full md:w-1/4"
          defaultValue=""
        >
          <option value="">Tipo de propiedad</option>
          <option value="house">Casa</option>
          <option value="apartment">Departamento</option>
          <option value="land">Terreno</option>
          <option value="office">Oficina</option>
        </select>

        <input
          type="number"
          name="priceMin"
          placeholder="Precio mínimo"
          className="border rounded-lg p-2 w-full md:w-1/4"
        />
        <input
          type="number"
          name="priceMax"
          placeholder="Precio máximo"
          className="border rounded-lg p-2 w-full md:w-1/4"
        />

        <div className="w-full md:w-auto">
          <SearchButton label="Buscar" />
        </div>
      </form>
    </div>
  );
}
