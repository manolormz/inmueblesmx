import { useCallback, useEffect, useMemo, useState } from 'react';
import { useListingsSearch } from '@/hooks/useListingsSearch';

type Params = Record<string, string | number | undefined>;

export function useMapSearchSync(baseParams: Params, { auto = true }: { auto?: boolean } = {}) {
  const url = new URL(window.location.href);
  const [bbox, setBbox] = useState<string | undefined>(() => {
    const q = url.searchParams.get('bbox') || undefined;
    return q && q.split(',').length === 4 ? q : undefined;
  });
  const [pendingBbox, setPendingBbox] = useState<string | undefined>(undefined);

  const effectiveBbox = auto ? bbox : (pendingBbox ?? bbox);
  const params = useMemo<Params>(() => ({ ...baseParams, bbox: effectiveBbox }), [baseParams, effectiveBbox]);

  // Sincroniza la URL cuando cambia bbox (solo si auto)
  useEffect(() => {
    if (!auto) return;
    const u = new URL(window.location.href);
    if (bbox) {
      u.searchParams.set('bbox', bbox);
    } else {
      u.searchParams.delete('bbox');
    }
    window.history.replaceState({}, '', `${u.pathname}?${u.searchParams.toString()}`);
  }, [bbox, auto]);

  const setBboxSafe = useCallback((b: string) => {
    const parts = b.split(',').map(Number);
    if (parts.length === 4 && parts.every(n => !Number.isNaN(n))) {
      if (auto) setBbox(b);
      else setPendingBbox(b);
    }
  }, [auto]);

  const applyPending = useCallback(() => {
    if (!pendingBbox) return;
    setBbox(pendingBbox);
    setPendingBbox(undefined);
    const u = new URL(window.location.href);
    u.searchParams.set('bbox', pendingBbox);
    window.history.replaceState({}, '', `${u.pathname}?${u.searchParams.toString()}`);
  }, [pendingBbox]);

  const clearPending = useCallback(() => setPendingBbox(undefined), []);

  const search = useListingsSearch(params);

  return { params, bbox: effectiveBbox, setBbox: setBboxSafe, pendingBbox, applyPending, clearPending, search };
}
