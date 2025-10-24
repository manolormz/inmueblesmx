import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocations } from "@/hooks/useLocations";
import EstadoSelect from "../components/EstadoSelect";
import MunicipioSelect from "../components/MunicipioSelect";

type Tipo = "casa" | "departamento" | "oficina" | "terreno" | "otro";

function QuickSearch() {
  const nav = useNavigate();
  const { states, findMunicipalities, normalize } = useLocations();
  const [estado, setEstado] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [tipo, setTipo] = useState<Tipo | "">("");
  const [min, setMin] = useState<string>("");
  const [max, setMax] = useState<string>("");

  const municipios = useMemo(
    () => (estado ? findMunicipalities(estado) : []),
    [estado, findMunicipalities],
  );

  const onEstado = (v: string) => {
    setEstado(v);
    setMunicipio("");
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = new URLSearchParams();
    if (estado) q.set("estado", estado);
    if (municipio) q.set("municipio", municipio);
    if (tipo) q.set("tipo", tipo);
    if (min) q.set("min", String(parseInt(min) || ""));
    if (max) q.set("max", String(parseInt(max) || ""));
    nav(`/buscar?${q.toString()}`);
  };

  return (
    <section className="card bg-white rounded-2xl shadow-card p-6 md:p-8">
      <h1 className="font-display text-2xl md:text-3xl text-primary">Empieza tu búsqueda</h1>
      <p className="mt-2 text-sm md:text-base text-gray-700">
        Selecciona ubicación y un rango de precio; puedes refinar más detalles en la vista de búsqueda.
      </p>

      <form onSubmit={onSubmit} className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="label">Estado</label>
          <EstadoSelect value={estado} onChange={onEstado} options={states} />
        </div>

        <div>
          <label className="label">Municipio</label>
          <MunicipioSelect
            value={municipio}
            onChange={setMunicipio}
            options={municipios}
            disabled={!estado}
          />
        </div>

        <div>
          <label className="label">Tipo de propiedad</label>
          <select
            className="select"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as Tipo | "")}
            aria-label="Tipo de propiedad"
          >
            <option value="">Cualquiera</option>
            <option value="casa">Casa</option>
            <option value="departamento">Departamento</option>
            <option value="oficina">Oficina</option>
            <option value="terreno">Terreno</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div>
          <label className="label">Precio mínimo (MXN)</label>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Ej. 1500000"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            aria-label="Precio mínimo"
          />
        </div>

        <div>
          <label className="label">Precio máximo (MXN)</label>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Ej. 4500000"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            aria-label="Precio máximo"
          />
        </div>

        <div className="flex items-end">
          <button type="submit" className="btn btn-primary w-full md:w-auto" aria-label="Buscar ahora">
            Buscar ahora
          </button>
        </div>
      </form>
    </section>
  );
}

export default function Home() {
  return (
    <div className="space-y-10 md:space-y-12">
      <QuickSearch />
    </div>
  );
}
