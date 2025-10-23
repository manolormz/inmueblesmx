import { useMemo, useState } from "react";
import SearchButton from "@/components/SearchButton";
import LocationField from "@/components/LocationField";
import { PropertyTypeOptions } from "@shared/options";

export function HeroSearch() {
  type OperationLocal = "Sale" | "Rent";
  const [operation, setOperation] = useState<OperationLocal>("Sale");

  const [location, setLocation] = useState<any | null>(null);
  const [type, setType] = useState("");
  const priceRange = useMemo(
    () =>
      operation === "Rent"
        ? { placeholderMin: "3,000", placeholderMax: "100,000" }
        : { placeholderMin: "500,000", placeholderMax: "20,000,000" },
    [operation],
  );
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const params = new URLSearchParams();
    params.set("operation", operation);
    if (location?.stateId) params.set("state", String(location.stateId));
    if (location?.municipalityId)
      params.set("municipality", String(location.municipalityId));
    if (type) params.set("type", type);
    if (priceMin) params.set("priceMin", priceMin);
    if (priceMax) params.set("priceMax", priceMax);

    window.location.href = `/search?${params.toString()}`;
  }

  return (
    <div className="w-full flex flex-col items-center text-center gap-4">
      <div className="flex gap-3 justify-center">
        {(["Sale", "Rent"] as OperationLocal[]).map((op) => (
          <button
            key={op}
            type="button"
            onClick={() => setOperation(op)}
            className={`px-5 py-2 rounded-lg border ${
              operation === op
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300"
            }`}
          >
            {op === "Sale" ? "Comprar" : "Rentar"}
          </button>
        ))}
      </div>

      <form
        onSubmit={onSubmit}
        className="bg-white shadow-md rounded-xl p-4 flex flex-col gap-3 w-full max-w-5xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <LocationField value={location} onChange={setLocation} />
          </div>

          <select
            name="type"
            className="border rounded-lg p-2"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">Tipo de propiedad</option>
            {PropertyTypeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label_es}
              </option>
            ))}
          </select>

          <input
            type="number"
            name="priceMin"
            placeholder={`Precio mínimo (${priceRange.placeholderMin})`}
            className="border rounded-lg p-2"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            min={0}
          />
          <input
            type="number"
            name="priceMax"
            placeholder={`Precio máximo (${priceRange.placeholderMax})`}
            className="border rounded-lg p-2"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            min={0}
          />
        </div>

        <div className="flex justify-end">
          <SearchButton label="Buscar" />
        </div>
      </form>
    </div>
  );
}

export default HeroSearch;
