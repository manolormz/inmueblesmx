import React from "react";
import { Link } from "react-router-dom";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/buscar" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl" style={{ background: "#E7E3D0" }} />
            <span className="font-display text-xl tracking-wide">Kentra</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/buscar" className="hover:underline">Buscar</Link>
            {/* <Link to="/publicar" className="hover:underline">Publicar</Link> */}
            <button className="btn btn-secondary">Contactar</button>
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
