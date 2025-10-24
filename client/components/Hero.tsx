import React from "react";
export default function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl mb-10">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1600&auto=format&fit=crop"
          alt="Propiedad moderna con naturaleza"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#F8F7F3]/30 via-[#F8F7F3]/80 to-[#F8F7F3]" />
      </div>
      <div className="relative z-10 px-6 md:px-10 py-16 md:py-24 text-center">
        <h1 className="font-display text-4xl md:text-6xl font-semibold text-primary tracking-wide">
          Encuentra tu espacio en Kentra
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-base md:text-lg text-gray-700 leading-relaxed">
          Propiedades seleccionadas con criterios de ubicación, valor y calidad.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a className="btn btn-primary">Publicar propiedad</a>
          <a className="btn btn-secondary">Hablar con un asesor</a>
        </div>
      </div>
    </section>
  );
}
