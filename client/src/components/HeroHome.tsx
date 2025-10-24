import React from "react";
import { Link } from "react-router-dom";

export default function HeroHome() {
  return (
    <section className="relative h-[80vh] w-full overflow-hidden flex items-center justify-center text-center">
      {/* Video de fondo */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="https://cdn.coverr.co/videos/coverr-modern-house-1121/1080p.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Degradado overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(87,93,67,0.55) 0%, rgba(231,227,208,0.55) 40%, rgba(248,247,243,0.88) 90%)",
        }}
      />

      {/* Patrón sutil */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #1F1F1B 1px, transparent 0)",
          backgroundSize: "14px 14px",
        }}
      />

      {/* Fade suave al fondo para transición natural */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 inset-x-0 h-32 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(248,247,243,0) 0%, rgba(248,247,243,0.6) 40%, rgba(248,247,243,1) 100%)",
        }}
      />

      {/* Contenido */}
      <div className="relative z-10 max-w-3xl px-6">
        <h1 className="font-display text-4xl md:text-6xl text-primary font-semibold leading-tight">
          Encuentra el espacio perfecto
          <br />
          <span className="text-[color:var(--color-text)]">
            para tu próxima etapa
          </span>
        </h1>

        <p className="mt-4 text-base md:text-lg text-gray-700 leading-relaxed">
          Kentra combina tecnología, diseño y confianza para ayudarte a
          encontrar un hogar con propósito.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            to="/buscar"
            className="btn btn-primary text-base md:text-lg px-8"
          >
            Explorar propiedades
          </Link>
          <Link
            to="/contacto"
            className="btn btn-secondary text-base md:text-lg px-8"
          >
            Hablar con un asesor
          </Link>
        </div>
      </div>
    </section>
  );
}
