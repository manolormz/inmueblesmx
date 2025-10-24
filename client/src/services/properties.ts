export type Property = {
  id: string;
  title: string;
  price?: number;
  state?: string;
  municipality?: string;
  type?: string;
  image?: string;
  badges?: string[];
  createdAt?: string | null;
};

export type SearchQuery = {
  page?: number; // 1-based
  pageSize?: number; // default 12
  modo?: "comprar" | "renta";
  estado?: string;
  municipio?: string;
  tipo?: string;
  min?: number;
  max?: number;
  order?: "recent" | "price_asc" | "price_desc";
};

export type SearchResponse = {
  items: Property[];
  total: number; // total estimado
  page: number;
  pageSize: number;
  hasNext: boolean;
  simulated?: boolean; // bandera para UI
};

function makeMock(q: SearchQuery): SearchResponse {
  const page = q.page ?? 1;
  const pageSize = q.pageSize ?? 12;
  const base = (page - 1) * pageSize;
  const items: Property[] = Array.from({ length: pageSize }).map((_, i) => {
    const idn = base + i + 1;
    return {
      id: `mock-${idn}`,
      title: `${q.tipo || "Propiedad"} en ${q.municipio || q.estado || "México"} #${idn}`,
      price: q.modo === "renta" ? 8000 + idn * 1000 : 1200000 + idn * 50000,
      state: q.estado || "CDMX",
      municipality: q.municipio || "Benito Juárez",
      type: q.tipo || "casa",
      image:
        "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?q=80&w=1200&auto=format&fit=crop",
      badges: idn % 3 === 0 ? ["Destacado"] : [],
      createdAt: new Date(Date.now() - idn * 86400000).toISOString(),
    };
  });
  const total = 120;
  const hasNext = page * pageSize < total;
  return { items, total, page, pageSize, hasNext, simulated: true };
}

export async function fetchProperties(q: SearchQuery): Promise<SearchResponse> {
  const page = q.page ?? 1;
  const pageSize = q.pageSize ?? 12;

  const url = new URL(
    (import.meta as any).env?.VITE_API_URL || "/api/properties",
    typeof location !== "undefined" ? location.origin : "https://example.com",
  );
  url.searchParams.set("page", String(page));
  url.searchParams.set("pageSize", String(pageSize));
  if (q.modo) url.searchParams.set("modo", q.modo);
  if (q.estado) url.searchParams.set("estado", q.estado);
  if (q.municipio) url.searchParams.set("municipio", q.municipio);
  if (q.tipo) url.searchParams.set("tipo", q.tipo);
  if (typeof q.min === "number") url.searchParams.set("min", String(q.min));
  if (typeof q.max === "number") url.searchParams.set("max", String(q.max));
  if (q.order) url.searchParams.set("order", q.order);

  try {
    const res = await fetch(url.toString(), {
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const items: Property[] = (data.items || data.results || []).map((p: any) => ({
      id: String(p.id ?? (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2))),
      title: String(p.title ?? p.nombre ?? "Propiedad"),
      price: typeof p.price === "number" ? p.price : p.precio,
      state: p.state ?? p.estado,
      municipality: p.municipality ?? p.municipio,
      type: p.type ?? p.tipo,
      image: p.image ?? p.foto ?? p.images?.[0],
      badges: p.badges ?? [],
      createdAt: p.createdAt ?? p.fecha ?? null,
    }));

    const total = Number(data.total ?? data.count ?? items.length);
    const hasNext = Boolean(data.hasNext ?? page * pageSize < total);

    return { items, total, page, pageSize, hasNext, simulated: false };
  } catch (e) {
    console.warn("[fetchProperties] fallback to mock due to:", e);
    return makeMock(q);
  }
}
