import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchProperties, Property, SearchQuery } from "../services/properties";

export function usePaginatedProperties(
  baseQuery: Omit<SearchQuery, "page" | "pageSize">,
  pageSize = 12,
) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [simulated, setSimulated] = useState(false);
  const inflight = useRef<Promise<any> | null>(null);
  const ids = useRef<Set<string>>(new Set());

  const query = useMemo(() => ({ ...baseQuery, page, pageSize }), [baseQuery, page, pageSize]);

  const load = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await (inflight.current = fetchProperties(query));
      setTotal(res.total);
      setHasNext(res.hasNext);
      setSimulated(Boolean(res.simulated));
      setItems((prev) => {
        const next = [...prev];
        for (const it of res.items) {
          if (!ids.current.has(it.id)) {
            ids.current.add(it.id);
            next.push(it);
          }
        }
        return next;
      });
    } finally {
      setLoading(false);
      inflight.current = null;
    }
  }, [query, loading]);

  useEffect(() => {
    setPage(1);
    setItems([]);
    setTotal(0);
    setHasNext(false);
    ids.current.clear();
  }, [JSON.stringify(baseQuery)]);

  useEffect(() => {
    load();
  }, [page, load]);

  const loadMore = useCallback(() => {
    if (hasNext && !loading) setPage((p) => p + 1);
  }, [hasNext, loading]);

  return { items, total, hasNext, loading, loadMore, simulated, page, pageSize };
}
