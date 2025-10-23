import { Suspense, lazy } from "react";

const MapView = lazy(() => import("@/components/MapView"));

type Marker = { id: string; lat: number; lng: number; title?: string };

export default function LazyMapView({
  onBoundsChange,
  markers = [],
  initialCenter,
  initialZoom,
  fitBbox,
}: {
  onBoundsChange: (bbox: string) => void;
  markers?: Marker[];
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  fitBbox?: string;
}) {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full grid place-items-center bg-white">
          <div className="text-sm opacity-70">Cargando mapa…</div>
        </div>
      }
    >
      <MapView
        onBoundsChange={onBoundsChange}
        markers={markers}
        initialCenter={initialCenter}
        initialZoom={initialZoom}
        fitBbox={fitBbox}
      />
    </Suspense>
  );
}
