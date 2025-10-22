import type { Operation, PropertyType, Currency, PublicationStatus } from "./options";

export type ID = string;

export interface Company {
  id: ID;
  name: string; // required
  rfc?: string | null;
  logo?: string | null; // file/image URL or asset id
  website?: string | null; // URL
  phone?: string | null;
  email?: string | null;
  address_text?: string | null; // long text
}

export type UserRole = "admin" | "agent" | "buyer";

export interface Profile {
  id: ID;
  full_name: string; // required
  photo?: string | null; // file/image URL or asset id
  bio?: string | null; // long text
  phone?: string | null;
  verified: boolean; // default false
  company?: ID | null; // reference -> Company
  role?: UserRole | null; // text with limited set
}

export interface Property {
  id: ID;
  title: string; // required
  description?: string | null; // long text
  operation: Operation; // required enum
  type: PropertyType; // required enum
  price: number; // min 0, required
  currency: Currency; // required enum
  bedrooms?: number | null; // min 0
  bathrooms?: number | null; // min 0
  parking?: number | null; // min 0
  built_m2?: number | null; // min 0
  land_m2?: number | null; // min 0
  address_text?: string | null;
  geo_lat?: number | null;
  geo_lng?: number | null;
  cover?: string | null; // file/image
  gallery?: string[] | null; // list of file/image
  status: PublicationStatus; // required enum, default Draft
  is_featured: boolean; // default false
  views: number; // default 0
  slug: string; // unique
  owner_company?: ID | null; // reference -> Company
  owner_profile?: ID | null; // reference -> Profile
  // filtros de ubicación
  city_slug?: string | null;
  neighborhood_slug?: string | null;
}

export interface Lead {
  id: ID;
  property: ID; // reference -> Property, required
  name: string; // required
  email?: string | null;
  phone?: string | null;
  message?: string | null; // longText
  created_at: Date; // default now
}
