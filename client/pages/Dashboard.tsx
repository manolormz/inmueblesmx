import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listProperties } from "@shared/repo";
import { formatPrice } from "@shared/formatters";
import { useState } from "react";
import { toast } from "sonner";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"props" | "leads" | "favs" | "settings">("props");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  if (!currentUser) return <Navigate to="/auth/login" replace />;

  const query = useQuery({
    queryKey: ["dashboard-props", page, pageSize, currentUser?.id],
    queryFn: async () => {
      const res = await listProperties({ status: undefined }, page, pageSize);
      // Demo: without real ownership, show all for agent/company, empty for buyer
      const data = (currentUser.role === "buyer") ? [] : res.items;
      return { ...res, items: data };
    },
  });

  const publishMut = useMutation({
    mutationFn: async (slug: string) => {
      const r = await fetch("/api/cms/property/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) });
      const j = await r.json().catch(() => ({} as any));
      if (r.status === 401 || j?.ok === false) { toast.error(j?.message || "Falta configuración del servidor"); return { ok: false } as any; }
      return j;
    },
    onSuccess: () => { toast.success("Propiedad publicada"); qc.invalidateQueries({ queryKey: ["dashboard-props"] }); },
    onError: () => toast.error("No se pudo publicar"),
  });

  const unpublishMut = useMutation({
    mutationFn: async (slug: string) => {
      const r = await fetch("/api/cms/property/unpublish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) });
      const j = await r.json().catch(() => ({} as any));
      if (r.status === 401 || j?.ok === false) { toast.error(j?.message || "Falta configuración del servidor"); return { ok: false } as any; }
      return j;
    },
    onSuccess: () => { toast.success("Propiedad despublicada"); qc.invalidateQueries({ queryKey: ["dashboard-props"] }); },
    onError: () => toast.error("No se pudo despublicar"),
  });

  const deleteMut = useMutation({
    mutationFn: async (slug: string) => {
      const r = await fetch("/api/cms/property", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) });
      const j = await r.json().catch(() => ({} as any));
      if (r.status === 401 || j?.ok === false) { toast.error(j?.message || "Falta configuración del servidor"); return { ok: false } as any; }
      return j;
    },
    onSuccess: () => { toast.success("Eliminado"); qc.invalidateQueries({ queryKey: ["dashboard-props"] }); },
    onError: () => toast.error("No se pudo eliminar"),
  });

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4">Panel</h1>
        <div className="flex gap-2 border-b mb-4">
          <button className={`px-3 py-2 ${tab==='props'?'border-b-2 border-blue-600 font-semibold':''}`} onClick={()=>setTab('props')}>Mis propiedades</button>
          <button className={`px-3 py-2 ${tab==='leads'?'border-b-2 border-blue-600 font-semibold':''}`} onClick={()=>setTab('leads')}>Leads</button>
          <button className={`px-3 py-2 ${tab==='favs'?'border-b-2 border-blue-600 font-semibold':''}`} onClick={()=>setTab('favs')}>Favoritos</button>
          <button className={`px-3 py-2 ${tab==='settings'?'border-b-2 border-blue-600 font-semibold':''}`} onClick={()=>setTab('settings')}>Ajustes</button>
        </div>

        {tab === 'props' && (
          <section>
            {query.isLoading ? (
              <div>Cargando…</div>
            ) : (query.data?.items?.length ?? 0) === 0 ? (
              <div className="text-gray-600">No hay propiedades. Crea una en <button className="text-blue-600 underline" onClick={()=>navigate('/publish')}>Publicar</button>.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-4">Título</th>
                      <th className="py-2 pr-4">Estado</th>
                      <th className="py-2 pr-4">Precio</th>
                      <th className="py-2 pr-4">Fecha</th>
                      <th className="py-2 pr-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {query.data!.items.map((p:any) => (
                      <tr key={p.id} className="border-b">
                        <td className="py-2 pr-4"><a className="text-blue-700" href={`/property/${p.slug}`}>{p.title}</a></td>
                        <td className="py-2 pr-4">{p.status}</td>
                        <td className="py-2 pr-4">{formatPrice(p.price, p.currency)}</td>
                        <td className="py-2 pr-4">—</td>
                        <td className="py-2 pr-4 flex gap-2">
                          <Button size="sm" variant="outline" onClick={()=>toast("Edición próximamente")}>Editar</Button>
                          {p.status !== 'Published' ? (
                            <Button size="sm" onClick={()=>publishMut.mutate(p.slug)} disabled={publishMut.isPending}>Publicar</Button>
                          ) : (
                            <Button size="sm" variant="secondary" onClick={()=>unpublishMut.mutate(p.slug)} disabled={unpublishMut.isPending}>Despublicar</Button>
                          )}
                          <Button size="sm" variant="destructive" onClick={()=>{ if (confirm('¿Eliminar?')) deleteMut.mutate(p.slug); }}>Eliminar</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button variant="outline" size="sm" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Anterior</Button>
                  <div className="text-sm">Página {page}</div>
                  <Button variant="outline" size="sm" onClick={()=>setPage(p=>p+1)}>Siguiente</Button>
                </div>
              </div>
            )}
          </section>
        )}

        {tab === 'leads' && (
          <section className="text-gray-600">Leads próximamente.</section>
        )}
        {tab === 'favs' && (
          <section className="text-gray-600">Favoritos próximamente.</section>
        )}
        {tab === 'settings' && (
          <section className="text-gray-600">Ajustes próximamente.</section>
        )}
      </main>
      <Footer />
    </div>
  );
}
