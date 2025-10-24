import React from "react";
import { Button } from "@/components/ui/button";

/**
 * Hero aspiracional para Kentra.
 * - Imagen cálida con vegetación/arquitectura moderna
 * - Degradado arena para legibilidad
 * - CTAs primario/secundario
 * - Altura adaptable: más alta en desktop
 */
export default function Hero() {
  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-[color:var(--color-border)]"
      aria-labelledby="hero-heading"
    >
      {/* Imagen de fondo */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=2000&auto=format&fit=crop"
          alt="Casa contemporánea rodeada de naturaleza"
          className="w-full h-full object-cover"
          loading="eager"
        />
        {/* Degradado cálido: de musgo a arena/crema */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(87,93,67,0.55) 0%, rgba(231,227,208,0.65) 45%, rgba(248,247,243,0.92) 85%)",
          }}
        />
        {/* Patrón sutil para textura */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #1F1F1B 1px, transparent 0)",
            backgroundSize: "14px 14px",
          }}
        />
      </div>

      {/* Contenido */}
      <div className="relative z-10 px-6 md:px-10 py-12 md:py-20 min-h-[320px] md:min-h-[420px] flex items-center">
        <div className="w-full text-center">
          <h1
            id="hero-heading"
            className="font-display text-3xl md:text-5xl font-semibold tracking-wide text-primary"
          >
            Encuentra tu espacio en <span className="text-primary">Kentra</span>
          </h1>
          <p className="mt-3 md:mt-4 text-sm md:text-base text-gray-700 max-w-2xl mx-auto leading-relaxed">
            Propiedades seleccionadas con criterios de ubicación, valor y calidad.
          </p>

          <div className="mt-6 md:mt-8 flex flex-wrap justify-center gap-3">
            <Button variant="default" aria-label="Publicar propiedad">
              Publicar propiedad
            </Button>
            <Button variant="secondary" aria-label="Hablar con un asesor">
              Hablar con un asesor
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
