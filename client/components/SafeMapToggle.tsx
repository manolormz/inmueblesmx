import { useMemo, useState } from "react";
import LazyMapView from "@/components/LazyMapView";

type Marker = { id: string; lat: number; lng: number; title?: string };

export default function SafeMapToggle({
  onBoundsChange,
  markers = [],
  initialCenter = { lat: 19.4326, lng: -99.1332 },
  initialZoom = 11,
  fitBbox,
  controls,
}: {
  onBoundsChange: (bbox: string) => void;
  markers?: Marker[];
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  fitBbox?: string;
  controls?: React.ReactNode; // ej. “Buscar en esta área”
}) {
  const [showMap, setShowMap] = useState(false);

  const mapEnabled = ((import.meta as any).env?.VITE_ENABLE_MAP ?? "1") === "1";
  const token = (import.meta as any).env?.VITE_MAPBOX_TOKEN as
    | string
    | undefined;

  const canMount = useMemo(() => mapEnabled && !!token, [mapEnabled, token]);

  return (
    <div className="relative w-full rounded-2xl border overflow-hidden">
      {!showMap && (
        <div className="h-[60vh] md:h-[70vh] grid place-items-center bg-gray-50">
          <div className="text-center space-y-2 px-4">
            <div className="text-sm opacity-70">
              {!mapEnabled ? (
                <>
                  Mapa deshabilitado (<code>VITE_ENABLE_MAP</code> ≠ 1). Puedes
                  activar cuando gustes.
                </>
              ) : !token ? (
                <>
                  Falta <code>VITE_MAPBOX_TOKEN</code>. Agrega el token y
                  reinicia.
                </>
              ) : (
                <>
                  Mapa listo para cargar bajo demanda. Tus formularios
                  permanecerán visibles.
                </>
              )}
            </div>
            <button
              disabled={!canMount}
              onClick={() => setShowMap(true)}
              className="px-4 py-2 rounded-xl border bg-white disabled:opacity-50"
            >
              Activar mapa (beta)
            </button>
          </div>
        </div>
      )}

      {showMap && (
        <div className="relative z-0">
          {/* Caja del mapa: nunca ocupa más que este contenedor */}
          <div className="h-[60vh] md:h-[70vh]">
            <LazyMapView
              onBoundsChange={onBoundsChange}
              markers={markers}
              initialCenter={initialCenter}
              initialZoom={initialZoom}
              fitBbox={fitBbox}
            />
          </div>

          {/* Controles opcionales, posicionados DENTRO del contenedor */}
          {controls && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
              {controls}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
