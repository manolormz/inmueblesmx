import { useEffect, useRef, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';

type MarkerData = { id: string; lat: number; lng: number; title?: string };

function debounce<T extends (...args: any[]) => void>(fn: T, ms = 400) {
  let t: number | undefined;
  return (...args: Parameters<T>) => {
    window.clearTimeout(t);
    // @ts-ignore
    t = window.setTimeout(() => fn(...args), ms);
  };
}

export default function MapView({
  initialCenter = { lat: 21.125, lng: -101.685 },
  initialZoom = 11,
  markers = [],
  onBoundsChange,
}: {
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  markers?: MarkerData[];
  onBoundsChange: (bbox: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const token = (import.meta as any).env?.VITE_MAPBOX_TOKEN as string | undefined;

  // Si no hay token, no intentamos cargar nada
  if (!token) {
    return (
      <div ref={containerRef} className="w-full h-[60vh] md:h-[70vh] rounded-2xl overflow-hidden border grid place-items-center">
        <div className="text-sm opacity-70 px-4 text-center">
          Mapa deshabilitado (falta <code>VITE_MAPBOX_TOKEN</code>). El resto de la página sigue funcionando.
        </div>
      </div>
    );
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mapboxgl = (await import('mapbox-gl')).default;
        mapboxgl.accessToken = token;

        if (!containerRef.current) return;
        // Evita doble init
        if (mapRef.current) return;

        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [initialCenter.lng, initialCenter.lat],
          zoom: initialZoom,
          attributionControl: true,
        });
        mapRef.current = map;

        const emitBounds = debounce(() => {
          try {
            const b = map.getBounds();
            const bbox = `${b.getWest()},${b.getSouth()},${b.getEast()},${b.getNorth()}`;
            onBoundsChange(bbox);
          } catch (e: any) {
            // No rompas la UI si falla
          }
        }, 400);

        map.on('load', emitBounds);
        map.on('moveend', emitBounds);
        map.on('zoomend', emitBounds);

        map.on('error', (evt: any) => {
          // Captura errores internos de mapa para no tumbar la app
          if (!cancelled) setError(evt?.error?.message || 'Error del mapa');
        });
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'No se pudo inicializar el mapa');
      }
    })();

    return () => {
      cancelled = true;
      try {
        if (mapRef.current) {
          mapRef.current.remove();
        }
      } catch {}
      mapRef.current = null;
      // limpia marcadores
      Object.values(markersRef.current).forEach((m) => {
        try { m.remove(); } catch {}
      });
      markersRef.current = {};
    };
  }, [initialCenter.lat, initialCenter.lng, initialZoom, onBoundsChange, token]);

  // Markers (idempotente y tolerante a fallos)
  useEffect(() => {
    (async () => {
      try {
        const map = mapRef.current;
        if (!map) return;
        const mapboxgl = (await import('mapbox-gl')).default;

        // eliminar los que ya no están
        const existing = markersRef.current;
        const incomingIds = new Set(markers.map(m => m.id));
        Object.keys(existing).forEach(id => {
          if (!incomingIds.has(id)) {
            existing[id].remove();
            delete existing[id];
          }
        });

        // crear/actualizar
        markers.forEach(m => {
          if (!existing[m.id]) {
            existing[m.id] = new mapboxgl.Marker({})
              .setLngLat([m.lng, m.lat])
              .setPopup(new mapboxgl.Popup({ offset: 16 }).setText(m.title || ''))
              .addTo(map);
          } else {
            existing[m.id].setLngLat([m.lng, m.lat]);
          }
        });
      } catch (e: any) {
        setError((prev) => prev ?? e?.message ?? 'Error con markers');
      }
    })();
  }, [markers]);

  return (
    <div className="relative">
      <div ref={containerRef} className="w-full h-[60vh] md:h-[70vh] rounded-2xl overflow-hidden border" />
      {error && (
        <div className="absolute inset-0 grid place-items-center bg-white/80 backdrop-blur-sm">
          <div className="text-sm text-red-700 border border-red-200 bg-red-50 px-3 py-2 rounded-lg">
            {String(error)}
          </div>
        </div>
      )}
    </div>
  );
}
