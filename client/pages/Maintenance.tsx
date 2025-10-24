import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Maintenance() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white">
      
      <main className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Servicio de mantenimiento</h1>
        <p className="text-gray-700 mb-8">
          Muy pronto podrás solicitar y dar seguimiento a servicios de
          mantenimiento para tu inmueble.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button type="button" onClick={() => navigate("/search")}>
            Explorar inmuebles
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/publish")}
          >
            Publicar propiedad
          </Button>
        </div>
      </main>
      
    </div>
  );
}
