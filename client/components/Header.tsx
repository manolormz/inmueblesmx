import { Button } from "@/components/ui/button";
import { Search, MapPin, Home } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import onClickLog from "@/debug/onClickLog";
import { useAuth } from "@/auth/AuthContext";
import { toast } from "sonner";

export function Header() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50" data-loc="client/components/Header.tsx:6:5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Home className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">InmueblesMX</span>
          </div>

          <nav className="hidden md:flex items-center gap-8" aria-label="Principal">
            <Link
              to={{ pathname: "/search", search: "?operation=Sale&status=Published" }}
              onClick={onClickLog("nav-comprar")}
              className="text-gray-700 hover:text-blue-600 transition"
              role="link"
            >
              Comprar
            </Link>
            <Link
              to={{ pathname: "/search", search: "?operation=Rent&status=Published" }}
              onClick={onClickLog("nav-rentar")}
              className="text-gray-700 hover:text-blue-600 transition"
              role="link"
            >
              Rentar
            </Link>
            <Link
              to="/publish"
              onClick={onClickLog("nav-vender")}
              className="text-gray-700 hover:text-blue-600 transition"
              role="link"
            >
              Vender
            </Link>
            <Link
              to="/maintenance"
              onClick={onClickLog("nav-mantenimiento")}
              className="text-gray-700 hover:text-blue-600 transition"
              aria-label="Mantenimiento"
              data-loc="NavbarMaintenance"
            >
              Mantenimiento
            </Link>
          </nav>

          <div className="flex items-center gap-3" data-loc="Navbar">
            {!currentUser ? (
              <>
                <Link to="/auth/login" className="text-gray-700 hover:text-blue-600 transition" data-loc="NavbarLogin">Iniciar sesión</Link>
                <Link to="/auth/register" className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium" data-loc="NavbarRegister">Registrarse</Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700">Hola, {currentUser.full_name.split(" ")[0]}</span>
                <Button type="button" size="sm" variant="ghost" onClick={() => { logout().then(()=>{ toast.success("Sesión cerrada"); navigate("/"); }); }} data-loc="NavbarLogout">Cerrar sesión</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
