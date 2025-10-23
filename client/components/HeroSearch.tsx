import SearchButton from "@/components/SearchButton";
import { PropertyTypeOptions } from "@shared/options";
import { useNavigate } from "react-router-dom";

export function HeroSearch() {
  const navigate = useNavigate();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const operation = (form.get("operation") || "").toString().trim();
    const type = (form.get("type") || "").toString().trim();
    const priceMin = (form.get("priceMin") || "").toString().trim();
    const priceMax = (form.get("priceMax") || "").toString().trim();

    const params = new URLSearchParams();
    if (operation) params.set("operation", operation);
    if (type) params.set("type", type);
    if (priceMin) params.set("priceMin", priceMin);
    if (priceMax) params.set("priceMax", priceMax);

    navigate(`/search?${params.toString()}`);
  }

  return (
    <section className="bg-gradient-to-br from-blue-50 to-blue-100 py-10 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-5">
          <form onSubmit={onSubmit} className="flex flex-col gap-3 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select name="operation" className="border rounded p-2">
                <option value="">Operación</option>
                <option value="Sale">Comprar</option>
                <option value="Rent">Rentar</option>
              </select>

              <select name="type" className="border rounded p-2">
                <option value="">Tipo de propiedad</option>
                {PropertyTypeOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label_es}</option>
                ))}
              </select>

              <input
                type="number"
                name="priceMin"
                placeholder="Precio mínimo"
                className="border rounded p-2"
                min={0}
              />
              <input
                type="number"
                name="priceMax"
                placeholder="Precio máximo"
                className="border rounded p-2"
                min={0}
              />
            </div>

            <div className="flex justify-end">
              <SearchButton label="Buscar" />
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

export default HeroSearch;
