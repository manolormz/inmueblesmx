import React from "react";
export default function WhyChoose() {
  const features = [
    { icon: "💰", title: "Mejores precios", text: "Accede a propiedades con el mejor valor del mercado." },
    { icon: "📍", title: "Expertos locales", text: "Agentes certificados en cada región del país." },
    { icon: "🔒", title: "Proceso seguro", text: "Transacciones verificadas y protegidas legalmente." },
  ];
  return (
    <section className="bg-secondary/40 rounded-2xl py-12 mt-12 text-center">
      <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary">¿Por qué elegir Kentra?</h2>
      <p className="mt-3 text-gray-700">Confianza, seguridad y un enfoque humano para tu próxima inversión inmobiliaria.</p>
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {features.map((f) => (
          <div key={f.title} className="flex flex-col items-center text-center space-y-3">
            <div className="text-4xl">{f.icon}</div>
            <h3 className="font-display text-lg text-primary">{f.title}</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{f.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
