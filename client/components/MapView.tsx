import { useEffect, useRef } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

type Marker = { id: string; lat: number; lng: number; title?: string };

export default function MapView({
  onBoundsChange,
  markers = [],
  initialCenter = { lat: 19.4326, lng: -99.1332 },
  initialZoom = 11,
}: {
  onBoundsChange: (bbox: string) => void;
  markers?: Marker[];
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const enabled = ((import.meta as any).env?.VITE_ENABLE_MAP ?? "0") === "1";
  const token = (import.meta as any).env?.VITE_MAPBOX_TOKEN as
    | string
    | undefined;

  useEffect(() => {
    if (!enabled || !token || !ref.current) return;
    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      mapboxgl.accessToken = token;
      const m = new mapboxgl.Map({
        container: ref.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [initialCenter.lng, initialCenter.lat],
        zoom: initialZoom,
      });
      mapRef.current = m;

      const emit = () => {
        const b = m.getBounds();
        if (!b) return;
        const bbox = `${b.getWest()},${b.getSouth()},${b.getEast()},${b.getNorth()}`;
        onBoundsChange(bbox);
      };
      m.on("moveend", emit);
      m.on("load", () => {
        try {
          m.resize();
        } catch {}
        emit();
      });

      return () => {
        m.remove();
      };
    })();
  }, [
    enabled,
    token,
    initialCenter.lat,
    initialCenter.lng,
    initialZoom,
    onBoundsChange,
  ]);

  useEffect(() => {
    (async () => {
      const m = mapRef.current;
      if (!m || !enabled || !token) return;
      const mapboxgl = (await import("mapbox-gl")).default;
      markers.slice(0, 200).forEach((pt) => {
        new mapboxgl.Marker().setLngLat([pt.lng, pt.lat]).addTo(m);
      });
    })();
  }, [markers, enabled, token]);

  if (!enabled || !token) {
    return (
      <div className="w-full h-full grid place-items-center bg-gray-50">
        <div className="text-sm opacity-70">Mapa deshabilitado</div>
      </div>
    );
  }

  return <div ref={ref} className="w-full h-full" />;
}
