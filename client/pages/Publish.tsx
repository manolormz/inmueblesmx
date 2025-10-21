import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { PropertySchema } from "@shared/schemas";
import { CurrencyOptions, OperationOptions, PropertyTypeOptions } from "@shared/options";
import { slugifyEs } from "@shared/formatters";

function kebabCase(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function shortId(len = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[(Math.random() * chars.length) | 0];
  return out;
}

type FormValues = {
  title: string;
  description?: string;
  price: number;
  currency: string;
  operation: string;
  type: string;
  bedrooms?: number;
  bathrooms?: number;
  parking?: number;
  built_m2?: number;
  land_m2?: number;
  address_text?: string;
  geo_lat?: number;
  geo_lng?: number;
  cover?: string; // URL for simplicity
  gallery?: string; // comma-separated URLs
};

export default function Publish() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(
      // Adapted schema: make status/slug optional here; added defaults server-side
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
  });

  async function onSubmit(values: FormValues) {
    const slug = `${slugifyEs(values.title)}-${shortId(6)}`;
    const payload = {
      ...values,
      gallery: values.gallery ? values.gallery.split(",").map((s) => s.trim()).filter(Boolean) : [],
      status: "Draft",
      is_featured: false,
      views: 0,
      slug,
    };

    try {
      toast("Guardando…");
      const res = await fetch("/api/cms/property", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      toast.success("Propiedad guardada con éxito (borrador)");
      navigate(`/property/${data?.data?.slug ?? slug}`);
    } catch (err: any) {
      toast.error("No se pudo guardar la propiedad. Configura la API Key de Builder.");
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">Publicar propiedad</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-busy={isSubmitting}>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Título</label>
            <Input placeholder="Casa en Polanco" {...register("title", { required: true })} />
            {errors.title && <p className="text-sm text-red-600 mt-1">Este campo es obligatorio.</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <Textarea placeholder="Descripción" rows={5} {...register("description")} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Precio</label>
            <Input type="number" step="1" min={0} placeholder="2500000" {...register("price", { valueAsNumber: true, min: 0 })} />
            {errors.price && <p className="text-sm text-red-600 mt-1">El precio debe ser mayor o igual a 0.</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Moneda</label>
            <Select onValueChange={(v) => setValue("currency", v, { shouldValidate: true })}>
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
            {errors.currency && <p className="text-sm text-red-600 mt-1">Este campo es obligatorio.</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Operación</label>
            <Select onValueChange={(v) => setValue("operation", v, { shouldValidate: true })}>
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
            {errors.operation && <p className="text-sm text-red-600 mt-1">Este campo es obligatorio.</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tipo</label>
            <Select onValueChange={(v) => setValue("type", v, { shouldValidate: true })}>
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
            {errors.type && <p className="text-sm text-red-600 mt-1">Este campo es obligatorio.</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Recámaras</label>
            <Input type="number" min={0} {...register("bedrooms", { valueAsNumber: true })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Baños</label>
            <Input type="number" min={0} {...register("bathrooms", { valueAsNumber: true })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Estacionamientos</label>
            <Input type="number" min={0} {...register("parking", { valueAsNumber: true })} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Construcción m²</label>
            <Input type="number" min={0} {...register("built_m2", { valueAsNumber: true })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Terreno m²</label>
            <Input type="number" min={0} {...register("land_m2", { valueAsNumber: true })} />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Dirección</label>
            <Input placeholder="Col. Roma Norte, CDMX" {...register("address_text")} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Latitud</label>
            <Input type="number" step="any" {...register("geo_lat", { valueAsNumber: true })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Longitud</label>
            <Input type="number" step="any" {...register("geo_lng", { valueAsNumber: true })} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Cover (URL de imagen)</label>
            <Input placeholder="https://..." {...register("cover")} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Galería (URLs separadas por coma)</label>
            <Input placeholder="https://img1, https://img2" {...register("gallery")} />
          </div>

          <div className="md:col-span-2 flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting} aria-disabled={isSubmitting} data-loc="PublishSubmit">
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
        <p className="text-sm text-muted-foreground mt-4">El estado se guardará como Draft automáticamente.</p>
      </main>
      <Footer />
    </div>
  );
}
