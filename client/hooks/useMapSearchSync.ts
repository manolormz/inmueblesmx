import { useCallback, useEffect, useMemo, useState } from 'react';
import { useListingsSearch } from '@/hooks/useListingsSearch';

type Params = Record<string, string | number | undefined>;

export function useMapSearchSync(baseParams: Params) {
  const url = new URL(window.location.href);
  const [bbox, setBbox] = useState<string | undefined>(() => {
    const q = url.searchParams.get('bbox') || undefined;
    return q && q.split(',').length === 4 ? q : undefined;
  });

  const params = useMemo<Params>(() => ({ ...baseParams, bbox }), [baseParams, bbox]);

  // Sincroniza la URL cuando cambia bbox
  useEffect(() => {
    const u = new URL(window.location.href);
    if (bbox) {
      u.searchParams.set('bbox', bbox);
    } else {
      u.searchParams.delete('bbox');
    }
    // No reemplaza otros filtros existentes
    window.history.replaceState({}, '', `${u.pathname}?${u.searchParams.toString()}`);
  }, [bbox]);

  const setBboxSafe = useCallback((b: string) => {
    const parts = b.split(',').map(Number);
    if (parts.length === 4 && parts.every(n => !Number.isNaN(n))) {
      setBbox(b);
    }
  }, []);

  const search = useListingsSearch(params);

  return { params, bbox, setBbox: setBboxSafe, search };
}
