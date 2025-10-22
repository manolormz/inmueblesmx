import { CompanySchema, ProfileSchema, PropertySchema, LeadSchema } from "./schemas";
import type { Company, Profile, Property, Lead, PropertyInput, LeadInput } from "./schemas";
import type { Operation, PropertyType, PublicationStatus } from "./options";
import { OperationOptions, PropertyTypeOptions } from "./options";
import { slugifyEs } from "./formatters";

function shortId(len = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[(Math.random() * chars.length) | 0];
  return out;
}

function genId(): string {
  return `${Date.now().toString(36)}${shortId(6)}`;
}

function uniqueSlug(base: string, existing: Set<string>): string {
  let candidate = `${slugifyEs(base)}-${shortId(6)}`;
  while (existing.has(candidate)) {
    candidate = `${slugifyEs(base)}-${shortId(6)}`;
  }
  return candidate;
}

const companies: Company[] = [];
const profiles: Profile[] = [];
const properties: Property[] = [];
const leads: Lead[] = [];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function seedOnce() {
  if (companies.length || profiles.length || properties.length) return;

  // Seed Companies
  const c1 = CompanySchema.parse({ id: genId(), name: "Inmobiliaria Azteca", rfc: "IAZ010203ABC", website: "https://azteca.example.com", phone: "+52 55 1234 5678", email: "contacto@azteca.example.com", address_text: "Av. Reforma 123, CDMX" });
  const c2 = CompanySchema.parse({ id: genId(), name: "Tapatía Bienes Raíces", rfc: "TBR010203DEF", website: "https://tapatia.example.com", phone: "+52 33 2345 6789", email: "hola@tapatia.example.com", address_text: "Zona Centro, Guadalajara" });
  const c3 = CompanySchema.parse({ id: genId(), name: "Regia Propiedades", rfc: "RPR010203GHI", website: "https://regia.example.com", phone: "+52 81 3456 7890", email: "info@regia.example.com", address_text: "San Pedro, Monterrey" });
  companies.push(c1, c2, c3);

  // Seed Profiles (agents)
  const p1 = ProfileSchema.parse({ id: genId(), full_name: "María López", phone: "+52 55 9876 5432", verified: true, company: c1.id, role: "agent" });
  const p2 = ProfileSchema.parse({ id: genId(), full_name: "José García", phone: "+52 33 8765 4321", verified: true, company: c2.id, role: "agent" });
  const p3 = ProfileSchema.parse({ id: genId(), full_name: "Ana Pérez", phone: "+52 81 7654 3210", verified: true, company: c3.id, role: "agent" });
  profiles.push(p1, p2, p3);

  const cities = [
    { name: "CDMX", addr: "Col. Roma Norte, CDMX" },
    { name: "Guadalajara", addr: "Providencia, Guadalajara" },
    { name: "Monterrey", addr: "San Pedro Garza García, Monterrey" },
    { name: "Cancún", addr: "Zona Hotelera, Cancún" },
    { name: "Playa del Carmen", addr: "Centro, Playa del Carmen" },
  ];

  const ops = OperationOptions.map(o => o.value as Operation);
  const types = PropertyTypeOptions.map(t => t.value as PropertyType);

  const existingSlugs = new Set<string>();

  for (let i = 1; i <= 20; i++) {
    const city = cities[(i - 1) % cities.length];
    const title = `Propiedad ${i} en ${city.name}`;
    const status: PublicationStatus = i % 2 === 0 ? "Published" : (i % 3 === 0 ? "Moderation" : "Draft");
    const operation = i % 2 === 0 ? (i % 4 === 0 ? "Rent" : "Sale") : pick(ops);
    const type = pick(types);
    const bedrooms = Math.max(1, (i % 5));
    const bathrooms = Math.max(1, (i % 3));
    const price = 800000 + (i * 50000) + Math.floor(Math.random() * 200000);
    const ownerCompany = [c1, c2, c3][i % 3];
    const ownerProfile = [p1, p2, p3][i % 3];

    const citySlugMap: Record<string,string> = {
      "CDMX": "ciudad-de-mexico",
      "Guadalajara": "guadalajara",
      "Monterrey": "monterrey",
      "Cancún": "cancun",
      "Playa del Carmen": "playa-del-carmen",
    };
    const citySlug = citySlugMap[city.name] || slugifyEs(city.name);

    const candidateNeighborhoods: Record<string, string[]> = {
      "ciudad-de-mexico": ["roma-norte", "polanco"],
      "guadalajara": ["guadalajara-centro", "providencia"],
      "monterrey": ["san-pedro-garza-garcia", "valle-oriente"],
      "cancun": ["zona-hotelera"],
      "playa-del-carmen": ["centro"],
    };
    const neighChoices = candidateNeighborhoods[citySlug] || [];
    const neighborhood_slug = neighChoices.length && i % 3 === 0 ? neighChoices[(i / 3) % neighChoices.length | 0] : undefined;

    const base: PropertyInput = {
      id: genId(),
      title,
      description: `Amplia propiedad en ${city.name} con excelentes acabados y ubicación privilegiada.`,
      operation,
      type,
      price,
      currency: "MXN",
      bedrooms,
      bathrooms,
      parking: (i % 3),
      built_m2: 60 + (i * 5),
      land_m2: 80 + (i * 5),
      address_text: city.addr,
      geo_lat: 19 + Math.random(),
      geo_lng: -99 + Math.random(),
      cover: "/placeholder.svg",
      gallery: ["/placeholder.svg"],
      status,
      is_featured: i % 4 === 0,
      views: Math.floor(Math.random() * 1000),
      slug: "temp", // replaced below
      owner_company: ownerCompany.id,
      owner_profile: ownerProfile.id,
      city_slug: citySlug,
      neighborhood_slug: neighborhood_slug,
    };

    const parsed = PropertySchema.parse(base);
    parsed.slug = uniqueSlug(parsed.title, existingSlugs);
    existingSlugs.add(parsed.slug);
    properties.push(parsed);
  }
}

seedOnce();

export type PropertyFilters = {
  operation?: Operation;
  type?: PropertyType;
  // price filters (support both aliases)
  minPrice?: number;
  maxPrice?: number;
  priceMin?: number;
  priceMax?: number;
  status?: PublicationStatus;
  owner_company?: string; // company id
  q?: string; // text search title/description
  // ubicación
  locationSlug?: string; // city
  neighborhoodSlug?: string; // neighborhood
  // extra facets
  minBedrooms?: number;
  minBathrooms?: number;
  minParking?: number;
  builtMin?: number;
  builtMax?: number;
  landMin?: number;
  landMax?: number;
  currency?: "MXN" | "USD";
  // sorting
  sortBy?: "id" | "price" | "views" | "title" | "built_m2";
  sortDir?: "asc" | "desc";
};

export async function listProperties(
  filters: PropertyFilters = {},
  page = 1,
  pageSize = 12,
): Promise<{ items: Property[]; total: number; page: number; pageSize: number }> {
  const {
    operation,
    type,
    minPrice,
    maxPrice,
    priceMin,
    priceMax,
    status,
    owner_company,
    q,
    minBedrooms,
    minBathrooms,
    minParking,
    builtMin,
    builtMax,
    landMin,
    landMax,
    currency,
    sortBy = "id",
    sortDir = "desc",
  } = filters as PropertyFilters & { locationSlug?: string; neighborhoodSlug?: string };

  let data = properties.slice();

  if (operation) data = data.filter((p) => p.operation === operation);
  if (type) data = data.filter((p) => p.type === type);
  // ubicación primero para reducir dataset
  if (filters.locationSlug) data = data.filter((p) => (p.city_slug ?? null) === filters.locationSlug);
  if (filters.neighborhoodSlug) data = data.filter((p) => (p.neighborhood_slug ?? null) === filters.neighborhoodSlug);
  const effMinPrice = typeof minPrice === "number" ? minPrice : priceMin;
  const effMaxPrice = typeof maxPrice === "number" ? maxPrice : priceMax;
  if (typeof effMinPrice === "number") data = data.filter((p) => p.price >= effMinPrice);
  if (typeof effMaxPrice === "number") data = data.filter((p) => p.price <= effMaxPrice);
  if (status) data = data.filter((p) => p.status === status);
  if (owner_company) data = data.filter((p) => p.owner_company === owner_company);
  if (typeof minBedrooms === "number") data = data.filter((p) => (p.bedrooms ?? 0) >= minBedrooms);
  if (typeof minBathrooms === "number") data = data.filter((p) => (p.bathrooms ?? 0) >= minBathrooms);
  if (typeof minParking === "number") data = data.filter((p) => (p.parking ?? 0) >= minParking);
  if (typeof builtMin === "number") data = data.filter((p) => (p.built_m2 ?? 0) >= builtMin);
  if (typeof builtMax === "number") data = data.filter((p) => (p.built_m2 ?? 0) <= builtMax);
  if (typeof landMin === "number") data = data.filter((p) => (p.land_m2 ?? 0) >= landMin);
  if (typeof landMax === "number") data = data.filter((p) => (p.land_m2 ?? 0) <= landMax);
  if (currency) data = data.filter((p) => p.currency === currency);
  if (q && q.trim()) {
    const needle = q.trim().toLowerCase();
    data = data.filter((p) =>
      p.title.toLowerCase().includes(needle) || (p.description ?? "").toLowerCase().includes(needle),
    );
  }

  data.sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortBy) {
      case "title":
        return a.title.localeCompare(b.title) * dir;
      case "views":
        return (a.views - b.views) * dir;
      case "built_m2":
        return ((a.built_m2 ?? 0) - (b.built_m2 ?? 0)) * dir;
      case "price":
        return (a.price - b.price) * dir;
      case "id":
      default:
        return a.id.localeCompare(b.id) * dir;
    }
  });

  const total = data.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const items = data.slice(start, end);

  return { items, total, page, pageSize };
}

export async function getPropertyBySlug(slug: string): Promise<Property | undefined> {
  return properties.find((p) => p.slug === slug);
}

export async function updatePropertyStatus(slug: string, status: PublicationStatus): Promise<Property | undefined> {
  const p = properties.find((x) => x.slug === slug);
  if (p) p.status = status;
  return p;
}

export async function createLead(payload: LeadInput): Promise<Lead> {
  const parsed = LeadSchema.parse({ ...payload, id: genId() });
  leads.push(parsed);
  return parsed;
}

// Expose seeded collections for potential use (read-only copies)
export async function getSeededCompanies(): Promise<Company[]> { return companies.slice(); }
export async function getSeededProfiles(): Promise<Profile[]> { return profiles.slice(); }
export async function getSeededProperties(): Promise<Property[]> { return properties.slice(); }
