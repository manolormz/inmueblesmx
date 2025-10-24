import React from "react";
import { Link } from "react-router-dom";
import LogoKentra from "./LogoKentra";
import Footer from "./Footer";

export default function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-primary/95 backdrop-blur-sm text-primary-foreground shadow-card border-b border-secondary/50 h-16 md:h-20 flex items-center">
        <div className="max-w-6xl mx-auto px-4 py-0 flex items-center justify-between w-full">
          <Link to="/buscar" className="flex items-center gap-3">
            <LogoKentra variant="monogram" theme="light" width={150} />
            <span className="font-display text-xl tracking-wide">Kentra</span>
          </Link>
          <nav className="flex items-center gap-6 font-display tracking-wide text-sm">
            <Link
              to="/buscar"
              className="text-white/90 hover:text-white"
            >
              Comprar
            </Link>
            <Link
              to="/search?operation=Rent&status=Published"
              className="text-white/90 hover:text-white"
            >
              Rentar
            </Link>
            <Link to="/publish" className="text-white/90 hover:text-white">
              Vender
            </Link>
            <Link to="/agencia" className="text-white/90 hover:text-white">
              Soy inmobiliaria
            </Link>
            <Link to="/maintenance" className="text-white/90 hover:text-white">
              Mantenimiento
            </Link>
            <button className="btn btn-secondary">Contactar</button>
            <Link to="/auth/register" className="btn btn-primary">
              Registrarse
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto p-4 md:p-6">{children}</div>
      </main>

      <Footer />
    </div>
  );
}
