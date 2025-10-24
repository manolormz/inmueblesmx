import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLocations } from "@/hooks/useLocations";
import EstadoSelect from "../components/EstadoSelect";
import MunicipioSelect from "../components/MunicipioSelect";
import HeroStripe from "../components/HeroStripe";

type Tipo =
  | "casa" | "departamento" | "oficina" | "terreno"
  | "local" | "bodega" | "loft" | "ph" | "otro";

const RENT = [5000, 7500, 10000, 12000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000] as const;
const SALE = [500000, 750000, 1000000, 1500000, 2000000, 3000000, 5000000, 7000000, 10000000, 15000000, 20000000] as const;

const fmt = (n:number) => n.toLocaleString("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0});

function QuickSearchCard(){
  const nav = useNavigate();
  const { states, findMunicipalities } = useLocations();
  const [params] = useSearchParams();

  const initialMode = (params.get("modo") || "comprar").toLowerCase() === "renta" ? "rentar" : "comprar";
  const [modo, setModo] = useState<"comprar"|"rentar">(initialMode);
  const [estado, setEstado] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [tipo, setTipo] = useState<Tipo | "">("");
  const [min, setMin] = useState<number | "">("");
  const [max, setMax] = useState<number | "">("");

  const municipios = useMemo(
    () => (estado ? findMunicipalities(estado) : []),
    [estado, findMunicipalities]
  );

  const prices = modo === "rentar" ? RENT : SALE;

  useEffect(()=>{
    if (min !== "" && max !== "" && (min as number) > (max as number)) {
      setMax("");
    }
  },[min, max, modo]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = new URLSearchParams();
    q.set("modo", modo === "rentar" ? "renta" : "comprar");
    if (estado) q.set("estado", estado);
    if (municipio) q.set("municipio", municipio);
    if (tipo) q.set("tipo", tipo);
    if (min !== "") q.set("min", String(min));
    if (max !== "") q.set("max", String(max));
    nav(`/buscar?${q.toString()}`);
  };

  const priceHelp = modo === "rentar" ? "mensual" : "de venta";

  return (
    <section className="relative -mt-10 md:-mt-14 z-20">
      <div className="card bg-white rounded-2xl shadow-card p-6 md:p-8">
        <div className="flex justify-center mb-4">
          <div className="inline-flex rounded-2xl overflow-hidden border border-primary/40" role="tablist" aria-label="Modo de búsqueda">
            <button
              role="tab" aria-selected={modo==="comprar"}
              className={`px-4 py-2 text-sm md:text-base font-medium ${modo==="comprar" ? "bg-primary text-white" : "bg-white"}`}
              onClick={()=>{ setModo("comprar"); setMin(""); setMax(""); }}
            >Comprar</button>
            <button
              role="tab" aria-selected={modo==="rentar"}
              className={`px-4 py-2 text-sm md:text-base font-medium ${modo==="rentar" ? "bg-primary text-white" : "bg-white"}`}
              onClick={()=>{ setModo("rentar"); setMin(""); setMax(""); }}
            >Rentar</button>
          </div>
        </div>

        <h2 className="font-display text-2xl md:text-3xl text-primary">Empieza tu búsqueda</h2>
        <p className="mt-1 text-sm md:text-base text-gray-700">
          Selecciona ubicación y un rango de precio {priceHelp}; podrás refinar más filtros en la vista de búsqueda.
        </p>

        <form onSubmit={onSubmit} className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="label">Estado</label>
            <EstadoSelect value={estado} onChange={(v)=>{ setEstado(v); setMunicipio(""); }} options={states} />
          </div>

          <div>
            <label className="label">Municipio</label>
            <MunicipioSelect value={municipio} onChange={setMunicipio} options={municipios} disabled={!estado} />
          </div>

          <div>
            <label className="label">Tipo de propiedad</label>
            <select className="select" value={tipo} onChange={(e)=>setTipo(e.target.value as Tipo | "")}>
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
            <label className="label">Precio mínimo (MXN)</label>
            <select className="select" value={min === "" ? "" : String(min)} onChange={(e)=>setMin(e.target.value ? Number(e.target.value) : "")}>
              <option value="">Sin mínimo</option>
              {prices.map(v => <option key={`min-${v}`} value={v}>{fmt(v)}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Precio máximo (MXN)</label>
            <select className="select" value={max === "" ? "" : String(max)} onChange={(e)=>setMax(e.target.value ? Number(e.target.value) : "")}>
              <option value="">Sin máximo</option>
              {prices.map(v => <option key={`max-${v}`} value={v}>{fmt(v)}</option>)}
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

export default function Home(){
  return (
    <div className="space-y-10 md:space-y-12">
      <HeroStripe />
      <QuickSearchCard />
    </div>
  );
}
