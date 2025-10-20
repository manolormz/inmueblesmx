import { Home } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Home className="w-6 h-6 text-blue-400" />
              <span className="text-lg font-bold text-white">InmueblesMX</span>
            </div>
            <p className="text-sm">
              La plataforma número uno para búsqueda de inmuebles en México
            </p>
          </div>

          {/* Buying */}
          <div>
            <h4 className="text-white font-semibold mb-4">Comprar</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition">
                  Buscar propiedades
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Cómo comprar
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Hipotecas
                </a>
              </li>
            </ul>
          </div>

          {/* Selling */}
          <div>
            <h4 className="text-white font-semibold mb-4">Vender</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition">
                  Vender tu propiedad
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Valúa tu inmueble
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Contacta un agente
                </a>
              </li>
            </ul>
          </div>

          {/* Renting */}
          <div>
            <h4 className="text-white font-semibold mb-4">Rentar</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition">
                  Propiedades en renta
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Arrendar mi propiedad
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Guía del inquilino
                </a>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="text-white font-semibold mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition">
                  Acerca de nosotros
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Contacto
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Privacidad
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Términos de uso
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <p className="text-sm text-gray-400">
              © 2024 InmueblesMX. Todos los derechos reservados.
            </p>
            <div className="flex gap-6 mt-4 sm:mt-0">
              <a href="#" className="text-sm text-gray-400 hover:text-white transition">
                Facebook
              </a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition">
                Twitter
              </a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition">
                Instagram
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
