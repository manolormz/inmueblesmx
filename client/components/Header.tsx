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
    <header
      className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50"
      data-loc="client/components/Header.tsx:6:5"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Home className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold text-primary">Kentra</span>
          </div>

          <nav
            className="hidden md:flex items-center gap-8"
            aria-label="Principal"
          >
            <Link
              to={{
                pathname: "/search",
                search: "?operation=Sale&status=Published",
              }}
              onClick={onClickLog("nav-comprar")}
              className="text-gray-700 hover:text-primary transition"
              role="link"
              data-loc="NavbarComprar"
            >
              Comprar
            </Link>
            <Link
              to={{
                pathname: "/search",
                search: "?operation=Rent&status=Published",
              }}
              onClick={onClickLog("nav-rentar")}
              className="text-gray-700 hover:text-primary transition"
              role="link"
            >
              Rentar
            </Link>
            <Link
              to="/publish"
              onClick={onClickLog("nav-vender")}
              className="text-gray-700 hover:text-primary transition"
              role="link"
            >
              Vender
            </Link>
            <Link
              to="/agencia"
              onClick={onClickLog("nav-agencia")}
              className="text-gray-700 hover:text-primary transition"
              role="link"
            >
              Soy inmobiliaria
            </Link>
            <Link
              to="/maintenance"
              onClick={onClickLog("nav-mantenimiento")}
              className="text-gray-700 hover:text-primary transition"
              aria-label="Mantenimiento"
              data-loc="NavbarMaintenance"
            >
              Mantenimiento
            </Link>
          </nav>

          <div className="flex items-center gap-3" data-loc="Navbar">
            {!currentUser ? (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary transition"
                  data-loc="NavbarLogin"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary"
                  data-loc="NavbarRegister"
                >
                  Registrarse
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700">
                  Hola, {currentUser.full_name.split(" ")[0]}
                </span>
                <Link
                  to="/dashboard"
                  className="px-3 py-2 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-50"
                  data-loc="NavbarAccount"
                >
                  Mi cuenta
                </Link>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    logout().then(() => {
                      toast.success("Sesión cerrada");
                      navigate("/");
                    });
                  }}
                  data-loc="NavbarLogout"
                >
                  Cerrar sesión
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
