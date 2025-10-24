import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLocations } from "../hooks/useLocations";
import EstadoSelect from "../components/EstadoSelect";
import MunicipioSelect from "../components/MunicipioSelect";
import HeroStripe from "../components/HeroStripe";

type Tipo =
  | "casa" | "departamento" | "oficina" | "terreno"
  | "local" | "bodega" | "loft" | "ph" | "otro";

const RENT_RANGES: Array<[number, number | null, string]> = [
  [0, 7500, "Hasta $7,500"],
  [7500, 10000, "$7,500 – $10,000"],
  [10000, 15000, "$10,000 – $15,000"],
  [15000, 20000, "$15,000 – $20,000"],
  [20000, 30000, "$20,000 – $30,000"],
  [30000, 50000, "$30,000 – $50,000"],
  [50000, 75000, "$50,000 – $75,000"],
  [75000, 100000, "$75,000 – $100,000"],
  [100000, null, "$100,000 o más"],
];

const SALE_RANGES: Array<[number, number | null, string]> = [
  [0, 750000, "Hasta $750 mil"],
  [750000, 1000000, "$750 mil – $1 MDP"],
  [1000000, 1500000, "$1 – $1.5 MDP"],
  [1500000, 2000000, "$1.5 – $2 MDP"],
  [2000000, 3000000, "$2 – $3 MDP"],
  [3000000, 5000000, "$3 – $5 MDP"],
  [5000000, 7000000, "$5 – $7 MDP"],
  [7000000, 10000000, "$7 – $10 MDP"],
  [10000000, 20000000, "$10 – $20 MDP"],
  [20000000, null, "$20 MDP o más"],
];

function QuickSearchCard() {
  const nav = useNavigate();
  const { states, findMunicipalities } = useLocations();
  const [params] = useSearchParams();

  const initialMode = (params.get("modo") || "comprar").toLowerCase() === "renta" ? "rentar" : "comprar";
  const [modo, setModo] = useState<"comprar" | "rentar">(initialMode);

  const [estado, setEstado] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [tipo, setTipo] = useState<Tipo | "">("");
  const [precioIdx, setPrecioIdx] = useState<string>("");

  const municipios = useMemo(() => (estado ? findMunicipalities(estado) : []), [estado, findMunicipalities]);

  const RANGES = modo === "rentar" ? RENT_RANGES : SALE_RANGES;

  useEffect(() => {
    setPrecioIdx("");
  }, [modo]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = new URLSearchParams();
    q.set("modo", modo === "rentar" ? "renta" : "comprar");
    if (estado) q.set("estado", estado);
    if (municipio) q.set("municipio", municipio);
    if (tipo) q.set("tipo", tipo);
    if (precioIdx !== "") {
      const [min, max] = RANGES[Number(precioIdx)];
      q.set("min", String(min));
      if (max != null) q.set("max", String(max));
    }
    nav(`/buscar?${q.toString()}`);
  };

  if (!states || states.length === 0) {
    return (
      <section className="relative -mt-10 md:-mt-14 z-20">
        <div className="card bg-white rounded-2xl shadow-card p-6 md:p-8">
          <h2 className="font-display text-2xl md:text-3xl text-primary">Empieza tu búsqueda</h2>
          <p className="mt-2 text-sm text-gray-700">Cargando catálogos de ubicación…</p>
          <div className="mt-4 h-10 w-full bg-secondary/50 rounded-xl animate-pulse" />
        </div>
      </section>
    );
  }

  return (
    <section className="relative -mt-10 md:-mt-14 z-20">
      <div className="card bg-white rounded-2xl shadow-card p-6 md:p-8">
        <div className="flex justify-center mb-4">
          <div className="inline-flex rounded-2xl overflow-hidden border border-primary/40" role="tablist" aria-label="Modo">
            <button
              role="tab"
              aria-selected={modo === "comprar"}
              className={`px-4 py-2 text-sm md:text-base font-medium ${modo === "comprar" ? "bg-primary text-white" : "bg-white"}`}
              onClick={() => setModo("comprar")}
            >
              Comprar
            </button>
            <button
              role="tab"
              aria-selected={modo === "rentar"}
              className={`px-4 py-2 text-sm md:text-base font-medium ${modo === "rentar" ? "bg-primary text-white" : "bg-white"}`}
              onClick={() => setModo("rentar")}
            >
              Rentar
            </button>
          </div>
        </div>

        <h2 className="font-display text-2xl md:text-3xl text-primary">Empieza tu búsqueda</h2>
        <p className="mt-1 text-sm md:text-base text-gray-700">
          Selecciona ubicación y un rango de precio; podrás refinar más filtros en la vista de búsqueda.
        </p>

        <form onSubmit={onSubmit} className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <EstadoSelect value={estado} onChange={(v) => { setEstado(v); setMunicipio(""); }} options={states} />
          </div>

          <div>
            <MunicipioSelect value={municipio} onChange={setMunicipio} options={municipios} disabled={!estado} />
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
              <option value="local">Local</option>
              <option value="bodega">Bodega</option>
              <option value="loft">Loft</option>
              <option value="ph">PH</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div>
            <label className="label">Precio ({modo === "rentar" ? "mensual" : "venta"})</label>
            <select
              className="select"
              value={precioIdx}
              onChange={(e) => setPrecioIdx(e.target.value)}
              aria-label="Rango de precio"
            >
              <option value="">Cualquiera</option>
              {RANGES.map((r, i) => (
                <option key={i} value={i}>{r[2]}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button type="submit" className="btn btn-primary w-full md:w-auto">Buscar ahora</button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="space-y-10 md:space-y-12">
      <HeroStripe />
      <QuickSearchCard />
    </div>
  );
}
