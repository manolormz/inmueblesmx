import { useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPropertyBySlug, createLead } from "@shared/repo";
import { getOptionLabelEs, formatPrice, slugifyEs } from "@shared/formatters";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthContext";

const LeadSchema = z.object({
  name: z.string().min(1, "Este campo es obligatorio."),
  email: z.string().email("Ingresa un correo válido."),
  phone: z.string().optional(),
  message: z.string().min(1, "Este campo es obligatorio."),
});

function useMeta(property?: any) {
  useEffect(() => {
    if (!property) return;
    const title = `${property.title} · ${formatPrice(property.price, property.currency)}`;
    document.title = title;
    const ensure = (sel: string, create: () => HTMLElement) => {
      let el = document.head.querySelector(sel) as HTMLElement | null;
      if (!el) {
        el = create();
        document.head.appendChild(el);
      }
      return el;
    };
    const desc = (property.description || "").slice(0, 160);
    ensure('meta[property="og:title"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("property", "og:title");
      return m;
    }).setAttribute("content", title);
    ensure('meta[property="og:description"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("property", "og:description");
      return m;
    }).setAttribute("content", desc);
    if (property.cover) {
      ensure('meta[property="og:image"]', () => {
        const m = document.createElement("meta");
        m.setAttribute("property", "og:image");
        return m;
      }).setAttribute("content", property.cover);
    }
    const site = (import.meta as any)?.env?.VITE_SITE_URL?.replace(/\/$/, "") || window.location.origin;
    const absUrl = `${site}/property/${property.slug}`;
    ensure('link[rel="canonical"]', () => {
      const l = document.createElement("link");
      l.setAttribute("rel", "canonical");
      return l;
    }).setAttribute("href", absUrl);
    ensure('meta[property="og:url"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("property", "og:url");
      return m;
    }).setAttribute("content", absUrl);
  }, [property]);
}

export default function Property() {
  const { slug = "" } = useParams();
  const qc = useQueryClient();
  const { currentUser } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["property", slug],
    queryFn: () => getPropertyBySlug(slug),
  });

  useMeta(data);

  const schema = LeadSchema;
  type LeadForm = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LeadForm>({ resolver: zodResolver(schema) });

  const submitLead = async (values: LeadForm) => {
    if (!data?.id) return;
    toast("Enviando…");
    await createLead({ property: data.id, name: values.name, email: values.email, phone: values.phone, message: values.message } as any);
    toast.success("Mensaje enviado con éxito");
    reset();
  };

  const canPublish = !!currentUser && currentUser.role !== "buyer";
  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!canPublish) {
        toast.error("Necesitas iniciar sesión como agente o empresa para publicar.");
        return;
      }
      if (!data?.slug) return;
      const resp = await fetch("/api/cms/property/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: data.slug }),
      });
      const json = await resp.json().catch(() => ({} as any));
      if (resp.status === 401 || json?.ok === false) {
        const msg = json?.message || "Falta configuración del servidor";
        toast.error(msg);
        return { ok: false } as any;
      }
      return json;
    },
    onMutate: () => { toast("Publicando…"); },
    onSuccess: async (res: any) => {
      if (res?.ok === false) return; // demo mode handled above
      toast.success("Propiedad publicada con éxito");
      await qc.invalidateQueries({ queryKey: ["property", slug] });
      await qc.invalidateQueries({ queryKey: ["properties"] });
    },
    onError: () => toast.error("No se pudo publicar la propiedad"),
  });

  const isOwner = canPublish;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container mx-auto px-4 py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-gray-200 rounded" />
            <div className="h-6 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-100 rounded w-1/3" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container mx-auto px-4 py-10 text-center">
          <h1 className="text-2xl font-semibold mb-2">No encontramos esta propiedad</h1>
          <p className="text-gray-600 mb-6">Es posible que el enlace sea incorrecto o haya sido removida.</p>
          <a href="/search" className="text-blue-600 hover:underline">Volver a buscar</a>
        </main>
        <Footer />
      </div>
    );
  }

  const p = data;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-8 space-y-6">
          {/* Gallery */}
          <div className="rounded-xl overflow-hidden border">
            <img src={p.cover || "/placeholder.svg"} alt={p.title} className="w-full h-80 object-cover" />
            {p.gallery && p.gallery.length > 0 && (
              <div className="grid grid-cols-4 gap-2 p-2">
                {p.gallery.slice(0, 8).map((src, i) => (
                  <img key={i} src={src || "/placeholder.svg"} alt={`${p.title} ${i + 1}`} className="h-20 w-full object-cover rounded" />
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <h1 className="text-2xl font-bold mb-2">{p.title}</h1>
            <div className="text-blue-700 text-xl font-semibold mb-2">{formatPriceCompactMXN(p.price, (p.operation === "Rent" ? "Rent" : "Sale"))}</div>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge>{getOptionLabelEs("Operation", p.operation as any)}</Badge>
              <Badge variant="outline">{getOptionLabelEs("PropertyType", p.type as any)}</Badge>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-gray-700 mb-4">
              {p.bedrooms != null && <span className="px-2 py-1 bg-gray-100 rounded">Recámaras: {p.bedrooms}</span>}
              {p.bathrooms != null && <span className="px-2 py-1 bg-gray-100 rounded">Baños: {p.bathrooms}</span>}
              {p.parking != null && <span className="px-2 py-1 bg-gray-100 rounded">Estacionamiento: {p.parking}</span>}
              {p.built_m2 != null && <span className="px-2 py-1 bg-gray-100 rounded">Construcción: {p.built_m2} m²</span>}
              {p.land_m2 != null && <span className="px-2 py-1 bg-gray-100 rounded">Terreno: {p.land_m2} m²</span>}
            </div>

            {p.address_text && <div className="text-gray-700 mb-4">{p.address_text}</div>}
            {p.description && (
              <div className="prose max-w-none">
                <h2 className="text-xl font-semibold mb-2">Descripción</h2>
                <p>{p.description}</p>
              </div>
            )}

            {p.geo_lat != null && p.geo_lng != null && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Ubicación</h3>
                <div className="w-full h-64 bg-gray-100 rounded flex items-center justify-center text-gray-500">
                  Mapa no disponible en demo ({p.geo_lat}, {p.geo_lng})
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          {p.status !== "Published" && isOwner && (
            <div className="rounded-xl border p-4">
              <h3 className="font-semibold mb-2">Estado</h3>
              <p className="text-sm text-gray-600 mb-3">La propiedad está en borrador. Puedes publicarla cuando est�� lista.</p>
              <Button type="button" onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending} aria-disabled={publishMutation.isPending} data-loc="PublishButton">
                {publishMutation.isPending ? "Publicando…" : "Publicar"}
              </Button>
            </div>
          )}

          <div className="rounded-xl border p-4">
            <h3 className="font-semibold mb-3">Contactar al agente</h3>
            <form
              onSubmit={handleSubmit(async (vals) => {
                try {
                  await submitLead(vals);
                } catch (e) {}
              })}
              aria-busy={isSubmitting}
            >
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="name">Nombre</label>
                  <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
                  {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="email">Correo</label>
                  <Input id="email" aria-invalid={!!errors.email} {...register("email")} />
                  {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="phone">Teléfono (opcional)</label>
                  <Input id="phone" {...register("phone")} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="message">Mensaje</label>
                  <Textarea id="message" rows={4} aria-invalid={!!errors.message} {...register("message")} />
                  {errors.message && <p className="text-sm text-red-600 mt-1">{errors.message.message}</p>}
                </div>
                <Button type="submit" disabled={isSubmitting} aria-disabled={isSubmitting} data-loc="LeadSubmit">{isSubmitting ? "Enviando…" : "Enviar"}</Button>
              </div>
            </form>
          </div>
        </aside>
      </main>
      <Footer />
    </div>
  );
}
