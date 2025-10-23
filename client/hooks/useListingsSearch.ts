import { useQuery } from '@tanstack/react-query';

export function useListingsSearch(params: Record<string, string | number | undefined | null>) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) qs.append(k, String(v));
  });

  const key = ['listings', Object.fromEntries(qs)];
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const r = await fetch(`/api/listings/search?${qs.toString()}`);
      if (!r.ok) throw new Error('Search failed');
      return r.json() as Promise<{ page: number; pageSize: number; total: number; results: any[] }>;
    },
  });
}
