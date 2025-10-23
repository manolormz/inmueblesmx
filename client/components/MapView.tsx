import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

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
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [initialCenter.lng, initialCenter.lat],
      zoom: initialZoom,
      attributionControl: true,
    });
    mapRef.current = map;

    const emitBounds = debounce(() => {
      const b = map.getBounds();
      const west = b.getWest();
      const south = b.getSouth();
      const east = b.getEast();
      const north = b.getNorth();
      const bbox = `${west},${south},${east},${north}`;
      onBoundsChange(bbox);
    }, 400);

    map.on('load', emitBounds);
    map.on('moveend', emitBounds);
    map.on('zoomend', emitBounds);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [initialCenter.lat, initialCenter.lng, initialZoom, onBoundsChange]);

  // Render/Update markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove stale markers
    const existing = markersRef.current;
    const incomingIds = new Set(markers.map(m => m.id));
    Object.keys(existing).forEach(id => {
      if (!incomingIds.has(id)) {
        existing[id].remove();
        delete existing[id];
      }
    });

    // Add/update markers
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
  }, [markers]);

  return (
    <div className="w-full h-[60vh] md:h-[70vh] rounded-2xl overflow-hidden border" ref={containerRef} />
  );
}
