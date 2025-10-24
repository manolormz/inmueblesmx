import React from "react";
export default function SubscribeBanner(){
  return (
    <section className="bg-primary text-primary-foreground rounded-2xl py-12 mt-16 text-center shadow-card">
      <h3 className="font-display text-2xl md:text-3xl font-semibold">Recibe las mejores oportunidades</h3>
      <p className="mt-2 text-sm md:text-base opacity-90">Sé el primero en conocer nuevas propiedades en Kentra.</p>
      <form className="mt-6 flex flex-col md:flex-row justify-center gap-3 max-w-md mx-auto">
        <input
          type="email"
          placeholder="Tu correo electrónico"
          className="input bg-white text-[color:var(--color-text)] placeholder-gray-500"
        />
        <button type="submit" className="btn btn-secondary">Suscribirse</button>
      </form>
    </section>
  );
}
