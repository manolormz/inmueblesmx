// Centralized option sets for the application. Option values are ASCII-only as required.

export type OptionBase = {
  value: string;
  display_order: number;
  label_es: string;
};

export type CurrencyOption = OptionBase & {
  symbol: string;
};

// Operation
export type Operation = "Rent" | "Sale" | "Transfer" | "Presale";
export const OperationOptions: OptionBase[] = [
  { value: "Rent", display_order: 1, label_es: "Renta" },
  { value: "Sale", display_order: 2, label_es: "Venta" },
  { value: "Transfer", display_order: 3, label_es: "Traspaso" },
  { value: "Presale", display_order: 4, label_es: "Preventa" },
];

// PropertyType
export type PropertyType =
  | "House"
  | "Apartment"
  | "Studio"
  | "Office"
  | "Commercial"
  | "Warehouse"
  | "Land"
  | "Building"
  | "Penthouse"
  | "Loft"
  | "Duplex"
  | "Industrial"
  | "Ranch"
  | "Hotel"
  | "Development"
  | "Other";

export const PropertyTypeOptions: OptionBase[] = [
  { value: "House", display_order: 1, label_es: "Casa" },
  { value: "Apartment", display_order: 2, label_es: "Departamento" },
  { value: "Studio", display_order: 3, label_es: "Estudio" },
  { value: "Office", display_order: 4, label_es: "Oficina" },
  { value: "Commercial", display_order: 5, label_es: "Local comercial" },
  { value: "Warehouse", display_order: 6, label_es: "Bodega" },
  { value: "Land", display_order: 7, label_es: "Terreno" },
  { value: "Building", display_order: 8, label_es: "Edificio" },
  { value: "Penthouse", display_order: 9, label_es: "Penthouse" },
  { value: "Loft", display_order: 10, label_es: "Loft" },
  { value: "Duplex", display_order: 11, label_es: "Dúplex" },
  { value: "Industrial", display_order: 12, label_es: "Industrial" },
  { value: "Ranch", display_order: 13, label_es: "Rancho" },
  { value: "Hotel", display_order: 14, label_es: "Hotel" },
  { value: "Development", display_order: 15, label_es: "Desarrollo" },
  { value: "Other", display_order: 16, label_es: "Otro" },
];

// PublicationStatus
export type PublicationStatus = "Draft" | "Moderation" | "Published";
export const PublicationStatusOptions: OptionBase[] = [
  { value: "Draft", display_order: 1, label_es: "Borrador" },
  { value: "Moderation", display_order: 2, label_es: "Moderación" },
  { value: "Published", display_order: 3, label_es: "Publicado" },
];

// HighlightType
export type HighlightType = "Home" | "Category" | "Urgent";
export const HighlightTypeOptions: OptionBase[] = [
  { value: "Home", display_order: 1, label_es: "Inicio" },
  { value: "Category", display_order: 2, label_es: "Categoría" },
  { value: "Urgent", display_order: 3, label_es: "Urgente" },
];

// Currency
export type Currency = "MXN" | "USD";
export const CurrencyOptions: CurrencyOption[] = [
  { value: "MXN", display_order: 1, label_es: "Peso mexicano", symbol: "$" },
  { value: "USD", display_order: 2, label_es: "Dólar estadounidense", symbol: "US$" },
];

// Helpers
export const OptionSets = {
  Operation: OperationOptions,
  PropertyType: PropertyTypeOptions,
  PublicationStatus: PublicationStatusOptions,
  HighlightType: HighlightTypeOptions,
  Currency: CurrencyOptions,
};

export type OptionSetName = keyof typeof OptionSets;

export function getOptionLabelEs<T extends OptionSetName>(
  set: T,
  value: (typeof OptionSets)[T][number]["value"],
): string | undefined {
  const found = (OptionSets[set] as OptionBase[]).find((o) => o.value === value);
  return found?.label_es;
}
