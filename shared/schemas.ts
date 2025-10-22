import { z } from "zod";
import { OperationOptions, PropertyTypeOptions, CurrencyOptions } from "./options";
import type { PublicationStatus } from "./options";
import type { UserRole } from "./models";

const operationEnum = z.enum(OperationOptions.map((o) => o.value) as [string, ...string[]]);
const propertyTypeEnum = z.enum(PropertyTypeOptions.map((o) => o.value) as [string, ...string[]]);
const currencyEnum = z.enum(CurrencyOptions.map((o) => o.value) as [string, ...string[]]);
const statusEnum = z.enum(["Draft", "Moderation", "Published"] satisfies PublicationStatus[] as [PublicationStatus, ...PublicationStatus[]]);
const roleEnum = z.enum(["admin", "agent", "buyer"] satisfies UserRole[] as [UserRole, ...UserRole[]]);

export const CompanySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  rfc: z.string().optional().nullable(),
  logo: z.string().url().or(z.string()).optional().nullable(),
  website: z.string().url().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address_text: z.string().optional().nullable(),
});

export const ProfileSchema = z.object({
  id: z.string().optional(),
  full_name: z.string().min(1),
  photo: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  verified: z.boolean().default(false),
  company: z.string().optional().nullable(), // reference id
  role: roleEnum.optional().nullable(),
});

export const PropertySchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  operation: operationEnum,
  type: propertyTypeEnum,
  price: z.number().min(0),
  currency: currencyEnum,
  bedrooms: z.number().min(0).optional().nullable(),
  bathrooms: z.number().min(0).optional().nullable(),
  parking: z.number().min(0).optional().nullable(),
  built_m2: z.number().min(0).optional().nullable(),
  land_m2: z.number().min(0).optional().nullable(),
  address_text: z.string().optional().nullable(),
  geo_lat: z.number().optional().nullable(),
  geo_lng: z.number().optional().nullable(),
  cover: z.string().optional().nullable(),
  gallery: z.array(z.string()).optional().nullable(),
  status: statusEnum.default("Draft"),
  is_featured: z.boolean().default(false),
  views: z.number().default(0),
  slug: z.string().min(1),
  owner_company: z.string().optional().nullable(),
  owner_profile: z.string().optional().nullable(),
  // filtros de ubicación
  city_slug: z.string().optional().nullable(),
  neighborhood_slug: z.string().optional().nullable(),
});

export const LeadSchema = z.object({
  id: z.string().optional(),
  property: z.string().min(1),
  name: z.string().min(1),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  created_at: z.coerce.date().default(() => new Date()),
});

export type CompanyInput = z.input<typeof CompanySchema>;
export type Company = z.output<typeof CompanySchema>;
export type ProfileInput = z.input<typeof ProfileSchema>;
export type Profile = z.output<typeof ProfileSchema>;
export type PropertyInput = z.input<typeof PropertySchema>;
export type Property = z.output<typeof PropertySchema>;
export type LeadInput = z.input<typeof LeadSchema>;
export type Lead = z.output<typeof LeadSchema>;
