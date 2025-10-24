import React from "react";

export default function HeroStripe() {
  return (
    <section className="relative h-[180px] md:h-[220px] w-full overflow-hidden rounded-2xl">
      <img
        src="https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1600&auto=format&fitcrop"
        alt="Arquitectura moderna con naturaleza"
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(87,93,67,0.35) 0%, rgba(248,247,243,0.85) 85%)" }}
      />
      <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
        <h1 className="font-display text-2xl md:text-4xl text-primary font-semibold tracking-wide">
          Encuentra rápido tu próximo hogar
        </h1>
      </div>
    </section>
  );
}
