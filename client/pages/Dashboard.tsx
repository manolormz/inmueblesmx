import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listProperties } from "@shared/repo";
import { formatPrice } from "@shared/formatters";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const tabParam = params.get("tab") as any as
    | "propiedades"
    | "leads"
    | "favoritos"
    | "ajustes"
    | null;
  const tab = tabParam || "propiedades";
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!currentUser) {
      toast("Inicia sesión para acceder a tu panel");
      navigate("/auth/login", { replace: true });
    }
  }, [currentUser, navigate]);

  const setTab = (t: "propiedades" | "leads" | "favoritos" | "ajustes") => {
    const next = new URLSearchParams(params);
    next.set("tab", t);
    setParams(next, { replace: true });
  };

  const mySlugs = useMemo<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("imx_my_props") || "[]");
    } catch {
      return [];
    }
  }, []);
  const favSlugs = useMemo<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("imx_favs") || "[]");
    } catch {
      return [];
    }
  }, []);

  const query = useQuery({
    enabled: !!currentUser,
    queryKey: [
      "dashboard-props",
      page,
      pageSize,
      currentUser?.id,
      mySlugs.join(","),
    ],
    queryFn: async () => {
      const res = await listProperties({ status: undefined }, page, pageSize);
      const data = res.items.filter((p: any) => mySlugs.includes(p.slug));
      return { ...res, items: data };
    },
  });

  const publishMut = useMutation({
    mutationFn: async (slug: string) => {
      const r = await fetch("/api/cms/property/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const j = await r.json().catch(() => ({}) as any);
      if (r.status === 401 || j?.ok === false) {
        toast.error(j?.message || "Falta configuración del servidor");
        return { ok: false } as any;
      }
      return j;
    },
    onSuccess: () => {
      toast.success("Propiedad publicada");
      qc.invalidateQueries({ queryKey: ["dashboard-props"] });
    },
    onError: () => toast.error("No se pudo publicar"),
  });

  const unpublishMut = useMutation({
    mutationFn: async (slug: string) => {
      const r = await fetch("/api/cms/property/unpublish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const j = await r.json().catch(() => ({}) as any);
      if (r.status === 401 || j?.ok === false) {
        toast.error(j?.message || "Falta configuración del servidor");
        return { ok: false } as any;
      }
      return j;
    },
    onSuccess: () => {
      toast.success("Propiedad despublicada");
      qc.invalidateQueries({ queryKey: ["dashboard-props"] });
    },
    onError: () => toast.error("No se pudo despublicar"),
  });

  const deleteMut = useMutation({
    mutationFn: async (slug: string) => {
      const r = await fetch("/api/cms/property", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const j = await r.json().catch(() => ({}) as any);
      if (r.status === 401 || j?.ok === false) {
        toast.error(j?.message || "Falta configuración del servidor");
        return { ok: false } as any;
      }
      return j;
    },
    onSuccess: () => {
      toast.success("Eliminado");
      qc.invalidateQueries({ queryKey: ["dashboard-props"] });
    },
    onError: () => toast.error("No se pudo eliminar"),
  });

  return (
    <div className="min-h-screen bg-white">
      
      <main className="container mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-12 gap-6">
        <aside className="md:col-span-3">
          <nav
            className="hidden md:block rounded border p-2"
            aria-label="Panel"
          >
            <button
              className={`block w-full text-left px-3 py-2 rounded ${tab === "propiedades" ? "bg-secondary text-primary" : ""}`}
              onClick={() => setTab("propiedades")}
            >
              Mis propiedades
            </button>
            <button
              className={`block w-full text-left px-3 py-2 rounded ${tab === "leads" ? "bg-secondary text-primary" : ""}`}
              onClick={() => setTab("leads")}
            >
              Leads
            </button>
            <button
              className={`block w-full text-left px-3 py-2 rounded ${tab === "favoritos" ? "bg-secondary text-primary" : ""}`}
              onClick={() => setTab("favoritos")}
            >
              Favoritos
            </button>
            <button
              className={`block w-full text-left px-3 py-2 rounded ${tab === "ajustes" ? "bg-secondary text-primary" : ""}`}
              onClick={() => setTab("ajustes")}
            >
              Ajustes
            </button>
          </nav>
          <div
            className="md:hidden flex gap-2 border-b"
            role="tablist"
            aria-label="Panel"
          >
            {(["propiedades", "leads", "favoritos", "ajustes"] as const).map(
              (t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  className={`px-3 py-2 ${tab === t ? "border-b-2 border-primary font-semibold" : ""}`}
                  onClick={() => setTab(t)}
                >
                  {t === "propiedades"
                    ? "Mis propiedades"
                    : t === "leads"
                      ? "Leads"
                      : t === "favoritos"
                        ? "Favoritos"
                        : "Ajustes"}
                </button>
              ),
            )}
          </div>
        </aside>

        <section className="md:col-span-9">
          {tab === "propiedades" && (
            <section>
              {query.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-10 bg-gray-100 animate-pulse rounded"
                    />
                  ))}
                </div>
              ) : (query.data?.items?.length ?? 0) === 0 ? (
                <div className="text-gray-600">
                  No hay propiedades propias. Crea una en{" "}
                  <button
                    className="text-primary underline"
                    onClick={() => navigate("/publish")}
                  >
                    Publicar
                  </button>
                  .
                </div>
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
                      {query.data!.items.map((p: any) => (
                        <tr key={p.id} className="border-b">
                          <td className="py-2 pr-4">
                            <a
                              className="text-primary"
                              href={`/property/${p.slug}`}
                            >
                              {p.title}
                            </a>
                          </td>
                          <td className="py-2 pr-4">{p.status}</td>
                          <td className="py-2 pr-4">
                            {formatPrice(p.price, p.currency)}
                          </td>
                          <td className="py-2 pr-4">—</td>
                          <td className="py-2 pr-4 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                navigate(`/dashboard/properties/${p.slug}/edit`)
                              }
                            >
                              Editar
                            </Button>
                            {p.status !== "Published" ? (
                              <Button
                                size="sm"
                                onClick={() => publishMut.mutate(p.slug)}
                                disabled={publishMut.isPending}
                              >
                                Publicar
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => unpublishMut.mutate(p.slug)}
                                disabled={unpublishMut.isPending}
                              >
                                Despublicar
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm("¿Eliminar?"))
                                  deleteMut.mutate(p.slug);
                              }}
                            >
                              Eliminar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Anterior
                    </Button>
                    <div className="text-sm">Página {page}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </section>
          )}

          {tab === "leads" && (
            <div className="text-gray-600">
              Aún no tienes leads. Cuando los recibas, aparecerán aquí con
              filtros y búsqueda.
            </div>
          )}
          {tab === "favoritos" && <FavsSection />}
          {tab === "ajustes" && <SettingsSection />}
        </section>
      </main>
      
    </div>
  );
}

function FavsSection() {
  const qc = useQueryClient();
  const favSlugs = useMemo<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("imx_favs") || "[]");
    } catch {
      return [];
    }
  }, []);
  const favsQuery = useQuery({
    queryKey: ["dashboard-favs", favSlugs.join(",")],
    queryFn: async () => {
      const res = await listProperties({ status: "Published" as any }, 1, 200);
      return res.items.filter((p: any) => favSlugs.includes(p.slug));
    },
  });
  if (favsQuery.isLoading)
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border p-4">
            <div className="h-40 bg-gray-200 rounded mb-3" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  const items = favsQuery.data || [];
  if (!items.length)
    return <div className="text-gray-600">No tienes favoritos todavía.</div>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((p: any) => (
        <article key={p.id} className="rounded-xl border overflow-hidden">
          <a href={`/property/${p.slug}`} className="block">
            <img
              src={p.cover || "/placeholder.svg"}
              alt={p.title}
              className="w-full h-40 object-cover"
            />
            <div className="p-4 space-y-2">
              <h3 className="font-semibold text-lg">{p.title}</h3>
              <div className="text-blue-700 font-semibold">
                {formatPrice(p.price, p.currency)}
              </div>
            </div>
          </a>
          <div className="p-4 pt-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                try {
                  const arr = JSON.parse(
                    localStorage.getItem("imx_favs") || "[]",
                  );
                  const next = arr.filter((s: string) => s !== p.slug);
                  localStorage.setItem("imx_favs", JSON.stringify(next));
                } catch {}
                qc.invalidateQueries({ queryKey: ["dashboard-favs"] });
              }}
            >
              Quitar
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}

function SettingsSection() {
  const { currentUser } = useAuth();
  return (
    <div className="space-y-3">
      <div className="rounded border p-4">
        <h2 className="font-semibold mb-1">Mi perfil</h2>
        <div className="text-sm text-gray-700">
          {currentUser!.full_name} · {currentUser!.email} · Rol:{" "}
          {currentUser!.role}
        </div>
      </div>
      <div className="rounded border p-4">
        <h2 className="font-semibold mb-1">Mi empresa</h2>
        <div className="text-sm text-gray-600">
          Próximamente podrás editar los datos de tu empresa.
        </div>
      </div>
    </div>
  );
}
