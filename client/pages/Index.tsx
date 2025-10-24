import { useEffect } from "react";
import { HeroSearch } from "@/components/HeroSearch";
import { FeaturedListings } from "@/components/FeaturedListings";
import { CTA } from "@/components/CTA";
import { listProperties } from "@shared/repo";

export default function Index() {
  useEffect(() => {
    (async () => {
      try {
        const { items, total } = await listProperties({
          page: 1,
          pageSize: 2,
        } as any);
        console.log(
          "✅ CMS conectado. Propiedades:",
          total,
          items?.[0]?.title || "ninguna",
        );
      } catch (error) {
        console.error("❌ Error con el CMS o modelos:", error);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <HeroSearch />
      <FeaturedListings />
      <CTA />
    </div>
  );
}
