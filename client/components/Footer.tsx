import React from "react";
export default function Footer(){
  const year = new Date().getFullYear();
  return (
    <footer className="bg-primary text-primary-foreground mt-16 rounded-t-2xl pt-12 pb-8">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
        <div>
          <h4 className="font-display font-semibold text-secondary">Kentra</h4>
          <p className="mt-2 opacity-90 leading-relaxed text-xs">
            La plataforma inmobiliaria hecha para encontrar tu espacio ideal con confianza y estilo.
          </p>
        </div>
        <div>
          <h4 className="font-semibold uppercase tracking-wide text-secondary text-xs">Comprar</h4>
          <ul className="space-y-1 mt-2 opacity-90">
            <li>Propiedades</li><li>Hipotecas</li><li>Asesores</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold uppercase tracking-wide text-secondary text-xs">Vender</h4>
          <ul className="space-y-1 mt-2 opacity-90">
            <li>Publicar propiedad</li><li>Valuación</li><li>Marketing</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold uppercase tracking-wide text-secondary text-xs">Empresa</h4>
          <ul className="space-y-1 mt-2 opacity-90">
            <li>Nosotros</li><li>Contacto</li><li>Privacidad</li>
          </ul>
        </div>
      </div>
      <div className="mt-10 border-t border-white/20 pt-4 text-xs text-center opacity-90">
        © {year} Kentra · Hecho con pasión en México · Terrarium Moss · Pantone 18-0416 TSX
      </div>
    </footer>
  );
}
