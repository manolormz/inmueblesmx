import React, { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useLocations } from "@/hooks/useLocations";
import EstadoSelect from "@/components/EstadoSelect";
import MunicipioSelect from "@/components/MunicipioSelect";
import Hero from "@/components/Hero";
import { FeaturedListings } from "@/components/FeaturedListings";
import WhyChoose from "@/components/WhyChoose";
import SubscribeBanner from "@/components/SubscribeBanner";

export default function Buscar() {
  const { loading, error, states, findMunicipalities, normalize } = useLocations();
  const [params, setParams] = useSearchParams();
  const estado = params.get("estado") ?? "";
  const municipio = params.get("municipio") ?? "";

  const municipalities = useMemo(
    () => (estado ? findMunicipalities(estado) : []),
    [estado, findMunicipalities]
  );

  const setEstado = (v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set("estado", v);
    else next.delete("estado");
    next.delete("municipio");
    setParams(next, { replace: true });
  };

  const setMunicipio = (v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set("municipio", v);
    else next.delete("municipio");
    setParams(next, { replace: true });
  };

  const propiedadesDemo = useMemo(
    () => [
      { id: 1, titulo: "Casa demo", estado: "Guanajuato", municipio: "León" },
      { id: 2, titulo: "Depto demo", estado: "Jalisco", municipio: "Guadalajara" },
      { id: 3, titulo: "Oficina demo", estado: "Guanajuato", municipio: "Irapuato" },
    ],
    []
  );

  const filtradas = useMemo(() => {
    return propiedadesDemo.filter((p) => {
      const okEstado = estado ? normalize(p.estado) === normalize(estado) : true;
      const okMpio = municipio ? normalize(p.municipio) === normalize(municipio) : true;
      return okEstado && okMpio;
    });
  }, [propiedadesDemo, estado, municipio, normalize]);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 bg-secondary/40 rounded-2xl">
      <Hero />

      {error && (
        <div className="p-3 rounded bg-red-50 border text-red-700">
          Error cargando ubicaciones: {String(error.message)}
        </div>
      )}

      <div className="card p-4 md:p-6">
        <div className="mb-4">
          <div className="inline-flex rounded-2xl overflow-hidden border border-primary/40">
            <button
              type="button"
              className={`px-4 py-2 text-sm md:text-base font-medium ${params.get("operation") === "Sale" ? "bg-primary text-white" : "bg-white text-[color:var(--color-text)]"}`}
              onClick={() => { const n = new URLSearchParams(params); n.set("operation","Sale"); setParams(n, { replace:true }); }}
            >
              Comprar
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm md:text-base font-medium ${params.get("operation") === "Rent" ? "bg-primary text-white" : "bg-white text-[color:var(--color-text)]"}`}
              onClick={() => { const n = new URLSearchParams(params); n.set("operation","Rent"); setParams(n, { replace:true }); }}
            >
              Rentar
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EstadoSelect value={estado} onChange={setEstado} options={states} disabled={loading} />
          <MunicipioSelect
            value={municipio}
            onChange={setMunicipio}
            options={municipalities}
            disabled={!estado || loading}
          />
        </div>
        <div className="mt-4">
          <button type="button" className="btn btn-primary w-full md:w-auto">Buscar</button>
        </div>
      </div>

      <div className="pt-4">
        <h2 className="text-lg font-medium mb-2">Resultados</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtradas.map((p) => (
            <li key={p.id} className="card p-4 hover:shadow">
              <div className="font-semibold">{p.titulo}</div>
              <div className="text-sm text-gray-600">
                {p.municipio}, {p.estado}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
