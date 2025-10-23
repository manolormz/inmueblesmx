import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

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
  fitBbox,
}: {
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  markers?: MarkerData[];
  onBoundsChange: (bbox: string) => void;
  fitBbox?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const clusterModeRef = useRef<boolean>(false);
  const layersAddedRef = useRef<boolean>(false);

  const token = (import.meta as any).env?.VITE_MAPBOX_TOKEN as
    | string
    | undefined;
  const mapEnabled = ((import.meta as any).env?.VITE_ENABLE_MAP ?? "1") === "1";

  // Kill-switch global para desactivar el mapa sin tocar código
  if (!mapEnabled) {
    return (
      <div className="w-full h-[60vh] md:h-[70vh] rounded-2xl overflow-hidden border grid place-items-center">
        <div className="text-sm opacity-70 px-4 text-center">
          Mapa deshabilitado (<code>VITE_ENABLE_MAP</code> ≠ 1). Los formularios
          siguen operando.
        </div>
      </div>
    );
  }

  // Si falta token, muestra placeholder pero no rompas la UI
  if (!token) {
    return (
      <div className="w-full h-[60vh] md:h-[70vh] rounded-2xl overflow-hidden border grid place-items-center">
        <div className="text-sm opacity-70 px-4 text-center">
          Mapa deshabilitado (falta <code>VITE_MAPBOX_TOKEN</code>). El resto de
          la página sigue funcionando.
        </div>
      </div>
    );
  }

  useEffect(() => {
    let cancelled = false;
    let resizeObs: ResizeObserver | null = null;
    let onVis: (() => void) | null = null;

    (async () => {
      try {
        const mapboxgl = (await import("mapbox-gl")).default as any;
        mapboxgl.accessToken = token;

        // 1) Soporte WebGL (en algunos iframes/editores está bloqueado)
        // @ts-ignore
        if (typeof mapboxgl.supported === "function" && !mapboxgl.supported()) {
          setError("WebGL no está soportado en este contexto (iframe/driver).");
          return;
        }

        if (!containerRef.current || mapRef.current) return;

        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: "mapbox://styles/mapbox/streets-v12",
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
          } catch {}
        }, 400);

        map.on("load", () => {
          try {
            map.resize();
          } catch {}
          emitBounds();
        });
        map.on("moveend", emitBounds);
        map.on("zoomend", emitBounds);

        // 3) Observa tamaño del contenedor y aplica resize
        if ("ResizeObserver" in window && containerRef.current) {
          resizeObs = new ResizeObserver(() => {
            try {
              map.resize();
            } catch {}
          });
          resizeObs.observe(containerRef.current);
        }

        // 4) Reacciona a visibilidad de la pestaña (evita layouts rotos)
        onVis = () => {
          try {
            map.resize();
          } catch {}
        };
        document.addEventListener("visibilitychange", onVis);

        map.on("error", (evt: any) => {
          if (!cancelled) setError(evt?.error?.message || "Error del mapa");
        });
      } catch (e: any) {
        if (!cancelled)
          setError(e?.message || "No se pudo inicializar el mapa");
      }
    })();

    return () => {
      cancelled = true;
      try {
        if (mapRef.current) mapRef.current.remove();
      } catch {}
      mapRef.current = null;

      Object.values(markersRef.current).forEach((m) => {
        try {
          m.remove();
        } catch {}
      });
      markersRef.current = {};

      try {
        resizeObs?.disconnect();
      } catch {}
      if (onVis) document.removeEventListener("visibilitychange", onVis);
    };
  }, [
    initialCenter.lat,
    initialCenter.lng,
    initialZoom,
    onBoundsChange,
    token,
  ]);

  // Fit external bbox request
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !fitBbox) return;
    const parts = fitBbox.split(',').map(Number);
    if (parts.length === 4 && parts.every(n => Number.isFinite(n))) {
      const [w,s,e,n] = parts;
      try { map.fitBounds([[w,s],[e,n]], { padding: 48, duration: 600 }); } catch {}
    }
  }, [fitBbox]);

  // Markers / clustering
  useEffect(() => {
    (async () => {
      try {
        const map = mapRef.current;
        if (!map) return;
        const mapboxgl = (await import("mapbox-gl")).default as any;

        const useClusters = markers.length > 200;
        if (useClusters) {
          // clear DOM markers
          Object.values(markersRef.current).forEach((m) => { try { m.remove(); } catch {} });
          markersRef.current = {};
          clusterModeRef.current = true;

          const data = {
            type: 'FeatureCollection',
            features: markers.map(m => ({ type:'Feature', properties:{ id:m.id, title:m.title||'' }, geometry:{ type:'Point', coordinates:[m.lng,m.lat] } }))
          } as const;
          const src:any = map.getSource('listings');
          if (!src) {
            map.addSource('listings', { type:'geojson', data, cluster:true, clusterMaxZoom:14, clusterRadius:50 });
          } else {
            src.setData(data);
          }
          if (!layersAddedRef.current) {
            map.addLayer({ id:'clusters', type:'circle', source:'listings', filter:['has','point_count'], paint:{ 'circle-color': ['step',['get','point_count'],'#90cdf4',100,'#63b3ed',750,'#3182ce'], 'circle-radius': ['step',['get','point_count'],20,100,28,750,36] } });
            map.addLayer({ id:'cluster-count', type:'symbol', source:'listings', filter:['has','point_count'], layout:{ 'text-field':'{point_count_abbreviated}','text-size':12 } });
            map.addLayer({ id:'unclustered-point', type:'circle', source:'listings', filter:['!',['has','point_count']], paint:{ 'circle-color':'#11b4da','circle-radius':6,'circle-stroke-width':1,'circle-stroke-color':'#fff' } });
            map.on('click','clusters', (e:any)=>{
              const features = map.queryRenderedFeatures(e.point, { layers:['clusters'] });
              const clusterId = features[0]?.properties?.cluster_id;
              const source:any = map.getSource('listings');
              if (clusterId && source) {
                source.getClusterExpansionZoom(clusterId, (err:any, zoom:number) => {
                  if (err) return;
                  map.easeTo({ center: features[0].geometry.coordinates, zoom });
                });
              }
            });
            map.on('click','unclustered-point', (e:any)=>{
              const f:any = e.features && e.features[0];
              if (!f) return;
              new mapboxgl.Popup({ offset:16 }).setLngLat(f.geometry.coordinates as [number,number]).setText(String(f.properties?.title||'')) .addTo(map);
            });
            layersAddedRef.current = true;
          }
        } else {
          // remove clustering layers/source if previously added
          if (clusterModeRef.current) {
            ['clusters','cluster-count','unclustered-point'].forEach(id=>{ try{ if(map.getLayer(id)) map.removeLayer(id); }catch{} });
            try{ if(map.getSource('listings')) (map.getSource('listings') as any).setData({ type:'FeatureCollection', features: [] }); }catch{}
            layersAddedRef.current = false;
            clusterModeRef.current = false;
          }
          // DOM markers
          const existing = markersRef.current;
          const incomingIds = new Set(markers.map(m => m.id));
          Object.keys(existing).forEach(id => {
            if (!incomingIds.has(id)) { existing[id].remove(); delete existing[id]; }
          });
          markers.forEach(m => {
            if (!existing[m.id]) {
              existing[m.id] = new mapboxgl.Marker({})
                .setLngLat([m.lng,m.lat])
                .setPopup(new mapboxgl.Popup({ offset:16 }).setText(m.title || ''))
                .addTo(map);
            } else {
              existing[m.id].setLngLat([m.lng,m.lat]);
            }
          });
        }
      } catch (e:any) {
        setError((prev)=> prev ?? e?.message ?? 'Error con markers');
      }
    })();
  }, [markers]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="w-full h-[60vh] md:h-[70vh] rounded-2xl overflow-hidden border bg-white"
      />
      {mapRef.current && (
        <div className="absolute bottom-2 left-2 z-20 px-2 py-1 text-xs bg-white/90 border rounded">
          token:{String(!!(import.meta as any).env?.VITE_MAPBOX_TOKEN)} • mode:{clusterModeRef.current ? 'cluster' : 'dom'} • markers:{Array.isArray(markers) ? markers.length : 0}
        </div>
      )}
      {error && (
        <div className="absolute inset-0 grid place-items-center bg-white/85 backdrop-blur-sm">
          <div className="text-sm text-red-700 border border-red-200 bg-red-50 px-3 py-2 rounded-lg max-w-sm text-center">
            {String(error)}
          </div>
        </div>
      )}
    </div>
  );
}
