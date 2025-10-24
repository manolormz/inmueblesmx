import { Heart, MapPin, Bed, Bath, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const FEATURED_LISTINGS = [
  {
    id: 1,
    title: "Casa de lujo en Polanco",
    location: "Polanco, CDMX",
    price: "$2,500,000",
    beds: 4,
    baths: 3,
    sqft: "350 m²",
    image:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500&h=400&fit=crop",
    featured: true,
  },
  {
    id: 2,
    title: "Departamento moderno con vista al mar",
    location: "Cancún, Quintana Roo",
    price: "$850,000",
    beds: 3,
    baths: 2,
    sqft: "200 m²",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=400&fit=crop",
    featured: false,
  },
  {
    id: 3,
    title: "Casa colonial restaurada",
    location: "Guadalajara, Jalisco",
    price: "$1,200,000",
    beds: 5,
    baths: 4,
    sqft: "420 m²",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=400&fit=crop",
    featured: false,
  },
  {
    id: 4,
    title: "Penthouse en Santa Fe",
    location: "Santa Fe, CDMX",
    price: "$3,800,000",
    beds: 4,
    baths: 3,
    sqft: "380 m²",
    image:
      "https://images.unsplash.com/photo-1523217582562-430f63602f46?w=500&h=400&fit=crop",
    featured: true,
  },
  {
    id: 5,
    title: "Residencia en zona residencial",
    location: "Monterrey, Nuevo León",
    price: "$1,650,000",
    beds: 4,
    baths: 3,
    sqft: "310 m²",
    image:
      "https://images.unsplash.com/photo-1570129476519-bbf64da27055?w=500&h=400&fit=crop",
    featured: false,
  },
  {
    id: 6,
    title: "Casa con jardín y piscina",
    location: "Playa del Carmen, Quintana Roo",
    price: "$1,950,000",
    beds: 4,
    baths: 3,
    sqft: "360 m²",
    image:
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=500&h=400&fit=crop",
    featured: true,
  },
];

function ListingCard({ listing }: { listing: (typeof FEATURED_LISTINGS)[0] }) {
  const [liked, setLiked] = useState(false);

  return (
    <div className="card overflow-hidden hover:shadow-lg transition border-0 rounded-2xl">
      <div className="relative">
        <img
          src={listing.image}
          alt={listing.title}
          className="w-full aspect-[4/3] object-cover rounded-xl"
        />
        {listing.featured && (
          <div className="absolute top-3 left-3 bg-primary text-primary-foreground px-3 py-1 rounded-xl text-xs uppercase tracking-wide">
            Destacado
          </div>
        )}
        <button
          onClick={() => setLiked(!liked)}
          className="absolute top-3 right-3 bg-white rounded-full p-2 hover:bg-gray-100 transition"
        >
          <Heart
            className={`w-5 h-5 ${liked ? "fill-red-500 text-red-500" : "text-gray-600"}`}
          />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900 flex-1">
            {listing.title}
          </h3>
        </div>

        <div className="flex items-center gap-1 text-gray-600 text-sm mb-3">
          <MapPin className="w-4 h-4" />
          {listing.location}
        </div>

        <div className="text-2xl font-bold text-primary mb-4">
          {listing.price}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4 text-center">
          <div className="flex flex-col items-center gap-1">
            <Bed className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-semibold text-gray-900">
              {listing.beds}
            </span>
            <span className="text-xs text-gray-600">Recámaras</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Bath className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-semibold text-gray-900">
              {listing.baths}
            </span>
            <span className="text-xs text-gray-600">Baños</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Ruler className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-semibold text-gray-900">
              {listing.sqft}
            </span>
            <span className="text-xs text-gray-600">Área</span>
          </div>
        </div>

        <Button variant="outline" className="w-full">
          Ver detalles
        </Button>
      </div>
    </div>
  );
}

export function FeaturedListings() {
  return (
    <section className="py-16 bg-secondary/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-text mb-3 font-display">
            Propiedades destacadas
          </h2>
          <p className="text-gray-600 text-lg">
            Descubre las mejores opciones en el mercado inmobiliario mexicano
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {FEATURED_LISTINGS.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="btn btn-primary px-8">
            Ver todas las propiedades
          </button>
        </div>
      </div>
    </section>
  );
}
