import { z } from "zod";

export const LeadInput = z.object({
  listingId: z.string().min(1, "Falta el ID de la propiedad"),
  name: z.string().min(2, "Nombre muy corto"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  message: z.string().optional(),
  company: z.string().optional(), // honeypot
});
export type LeadInputT = z.infer<typeof LeadInput>;

export const VisitInput = z.object({
  listingId: z.string().min(1),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  datetime: z.string().optional(),
  company: z.string().optional(), // honeypot
});
export type VisitInputT = z.infer<typeof VisitInput>;

export const AgencyInput = z.object({
  name: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Usa minúsculas y guiones"),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  company: z.string().optional(), // honeypot
});
export type AgencyInputT = z.infer<typeof AgencyInput>;

export const AuthLogin = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type AuthLoginT = z.infer<typeof AuthLogin>;

export const AuthRegister = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});
export type AuthRegisterT = z.infer<typeof AuthRegister>;
