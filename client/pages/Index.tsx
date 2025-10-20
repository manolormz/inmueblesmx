import { Header } from "@/components/Header";
import { HeroSearch } from "@/components/HeroSearch";
import { FeaturedListings } from "@/components/FeaturedListings";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";

export default function Index() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSearch />
      <FeaturedListings />
      <CTA />
      <Footer />
    </div>
  );
}
