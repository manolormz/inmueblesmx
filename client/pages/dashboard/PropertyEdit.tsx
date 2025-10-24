import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PropertySchema } from "@shared/schemas";
import {
  CurrencyOptions,
  OperationOptions,
  PropertyTypeOptions,
} from "@shared/options";
import { getPropertyBySlug } from "@shared/repo";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthContext";

export default function PropertyEdit() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState<any | null>(null);
  const mySlugs = useMemo<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("imx_my_props") || "[]");
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    if (!currentUser || currentUser.role === "buyer") {
      toast("No tienes permisos para editar esta propiedad");
      navigate("/dashboard?tab=propiedades", { replace: true });
      return;
    }
    (async () => {
      const p = await getPropertyBySlug(slug);
      if (!p) {
        toast("Propiedad no encontrada");
        navigate("/dashboard?tab=propiedades", { replace: true });
        return;
      }
      const owned = mySlugs.includes(slug) || !!p.owner_profile; // mock
      if (!owned) {
        toast("Solo el propietario puede editar esta propiedad");
        navigate("/dashboard?tab=propiedades", { replace: true });
        return;
      }
      setInitial(p);
      setLoading(false);
    })();
  }, [slug, currentUser, navigate]);

  const form = useForm<any>({
    resolver: zodResolver(
      PropertySchema.pick({
        title: true,
        description: true,
        price: true,
        currency: true,
        operation: true,
        type: true,
        bedrooms: true,
        bathrooms: true,
        parking: true,
        built_m2: true,
        land_m2: true,
        address_text: true,
        geo_lat: true,
        geo_lng: true,
        cover: true,
        gallery: true,
      }) as any,
    ),
    defaultValues: useMemo(
      () => ({
        title: initial?.title || "",
        description: initial?.description || "",
        price: initial?.price || 0,
        currency: initial?.currency || "MXN",
        operation: initial?.operation || "Sale",
        type: initial?.type || "House",
        bedrooms: initial?.bedrooms ?? undefined,
        bathrooms: initial?.bathrooms ?? undefined,
        parking: initial?.parking ?? undefined,
        built_m2: initial?.built_m2 ?? undefined,
        land_m2: initial?.land_m2 ?? undefined,
        address_text: initial?.address_text || "",
        geo_lat: initial?.geo_lat ?? undefined,
        geo_lng: initial?.geo_lng ?? undefined,
        cover: initial?.cover || "",
        gallery: (initial?.gallery || []).join(", "),
      }),
      [initial],
    ),
  });

  useEffect(() => {
    if (initial) form.reset(form.formState.defaultValues as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  async function onSubmit(values: any) {
    try {
      toast("Guardando…");
      const payload = {
        ...values,
        gallery: values.gallery
          ? String(values.gallery)
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [],
      };
      const resp = await fetch(
        `/api/cms/property/${encodeURIComponent(slug)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await resp.json().catch(() => ({}) as any);
      if (resp.status === 401 || json?.ok === false) {
        toast.error(json?.message || "Error al guardar");
        return;
      }
      const newSlug = json?.slug || slug;
      // update local ownership if slug changed
      if (newSlug !== slug) {
        try {
          const arr = JSON.parse(localStorage.getItem("imx_my_props") || "[]");
          const next = arr.map((s: string) => (s === slug ? newSlug : s));
          localStorage.setItem("imx_my_props", JSON.stringify(next));
        } catch {}
      }
      toast.success("Cambios guardados");
      navigate(`/property/${newSlug}`, { replace: true });
    } catch (e: any) {
      toast.error(e?.message || "Error al guardar");
    }
  }

  async function toggleVisibility(checked: boolean) {
    const url = checked
      ? "/api/cms/property/publish"
      : "/api/cms/property/unpublish";
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    const j = await r.json().catch(() => ({}) as any);
    if (r.status === 401 || j?.ok === false) {
      toast.error(j?.message || "Falta configuración del servidor");
      return;
    }
    toast.success(checked ? "Propiedad publicada" : "Propiedad despublicada");
  }

  if (loading)
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 animate-pulse rounded" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">Editar propiedad</h1>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          aria-busy={form.formState.isSubmitting}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1" htmlFor="title">
              Título
            </label>
            <Input
              id="title"
              {...form.register("title", { required: true })}
              aria-invalid={!!form.formState.errors.title}
            />
          </div>

          <div className="md:col-span-2">
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="description"
            >
              Descripción
            </label>
            <Textarea
              id="description"
              rows={5}
              {...form.register("description")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="price">
              Precio
            </label>
            <Input
              id="price"
              type="number"
              step="1"
              min={0}
              {...form.register("price", { valueAsNumber: true, min: 0 })}
              aria-invalid={!!form.formState.errors.price}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Moneda</label>
            <Select
              onValueChange={(v) =>
                form.setValue("currency", v, { shouldValidate: true })
              }
              defaultValue={String((form.getValues() as any).currency)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {CurrencyOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label_es}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Operación</label>
            <Select
              onValueChange={(v) =>
                form.setValue("operation", v, { shouldValidate: true })
              }
              defaultValue={String((form.getValues() as any).operation)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {OperationOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label_es}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tipo</label>
            <Select
              onValueChange={(v) =>
                form.setValue("type", v, { shouldValidate: true })
              }
              defaultValue={String((form.getValues() as any).type)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {PropertyTypeOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label_es}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="bedrooms"
            >
              Recámaras
            </label>
            <Input
              id="bedrooms"
              type="number"
              min={0}
              {...form.register("bedrooms", { valueAsNumber: true })}
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="bathrooms"
            >
              Baños
            </label>
            <Input
              id="bathrooms"
              type="number"
              min={0}
              {...form.register("bathrooms", { valueAsNumber: true })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="parking">
              Estacionamiento
            </label>
            <Input
              id="parking"
              type="number"
              min={0}
              {...form.register("parking", { valueAsNumber: true })}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="built_m2"
            >
              Construcción m²
            </label>
            <Input
              id="built_m2"
              type="number"
              min={0}
              {...form.register("built_m2", { valueAsNumber: true })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="land_m2">
              Terreno m²
            </label>
            <Input
              id="land_m2"
              type="number"
              min={0}
              {...form.register("land_m2", { valueAsNumber: true })}
            />
          </div>

          <div className="md:col-span-2">
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="address_text"
            >
              Dirección
            </label>
            <Input id="address_text" {...form.register("address_text")} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="geo_lat">
              Latitud
            </label>
            <Input
              id="geo_lat"
              type="number"
              step="any"
              {...form.register("geo_lat", { valueAsNumber: true })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="geo_lng">
              Longitud
            </label>
            <Input
              id="geo_lng"
              type="number"
              step="any"
              {...form.register("geo_lng", { valueAsNumber: true })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="cover">
              Cover (URL)
            </label>
            <Input id="cover" {...form.register("cover")} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="gallery">
              Galería (URLs separadas por coma)
            </label>
            <Input id="gallery" {...form.register("gallery")} />
          </div>

          <div className="md:col-span-2 flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <input
                id="visible"
                type="checkbox"
                defaultChecked={initial?.status === "Published"}
                onChange={(e) => toggleVisibility(e.target.checked)}
              />
              <label htmlFor="visible">Visible públicamente</label>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate("/dashboard?tab=propiedades")}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                aria-disabled={form.formState.isSubmitting}
                data-loc="EditSubmit"
              >
                {form.formState.isSubmitting ? "Guardando…" : "Guardar cambios"}
              </Button>
            </div>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
