import { lazy, Suspense } from 'react';
import StaticMapView from '@/components/MapView';

// Detecta si estamos dentro del sandbox de Builder.io (iframe)
const isSandbox = typeof window !== 'undefined' && window.location !== window.parent.location;

// Import dinámico normal para producción
const LazyLoaded = lazy(() => import('@/components/MapView'));

export default function LazyMapView(props: any) {
  if (isSandbox) {
    // Fallback estático en sandbox para evitar errores de dynamic import
    return <StaticMapView {...props} />;
  }
  return (
    <Suspense fallback={<div className="w-full h-full grid place-items-center bg-white">Cargando mapa…</div>}>
      <LazyLoaded {...props} />
    </Suspense>
  );
}
