import { Button } from "@/components/ui/button";
import { Search, MapPin, Home } from "lucide-react";

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Home className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">InmueblesMX</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-gray-700 hover:text-blue-600 transition">
              Comprar
            </a>
            <a href="#" className="text-gray-700 hover:text-blue-600 transition">
              Rentar
            </a>
            <a href="#" className="text-gray-700 hover:text-blue-600 transition">
              Vender
            </a>
            <a href="#" className="text-gray-700 hover:text-blue-600 transition">
              Mantenimiento
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">
              Iniciar sesión
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              Registrarse
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
