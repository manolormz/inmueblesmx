import React from "react";
import { Link } from "react-router-dom";
import LogoKentra from "./LogoKentra";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground shadow-sm" style={{ height: 64 }}>
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between h-full">
          <Link to="/buscar" className="flex items-center gap-2">
            <LogoKentra variant="monogram" theme="light" width={140} />
            <span className="sr-only">Kentra</span>
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link to="/buscar" className="hover:underline">Buscar</Link>
            {/* <Link to="/publicar" className="hover:underline">Publicar</Link> */}
            <button className="btn btn-secondary">Contactar</button>
            <Link to="/auth/register" className="btn btn-primary">Registrarse</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto p-4 md:p-6">{children}</div>
      </main>

      <footer className="mt-8 border-t border-[color:var(--color-border)] bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-600 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Kentra</span>
          <span>Terrarium Moss · Pantone 18-0416 TSX</span>
        </div>
      </footer>
    </div>
  );
}
