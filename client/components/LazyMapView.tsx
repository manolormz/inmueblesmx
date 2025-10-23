import MapView from '@/components/MapView';

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
  // Import estático para evitar el error de dynamic import en iframe/preview
  return (
    <MapView
      onBoundsChange={onBoundsChange}
      markers={markers}
      initialCenter={initialCenter}
      initialZoom={initialZoom}
      fitBbox={fitBbox}
    />
  );
}
