import { Currency, CurrencyOptions, OptionSets } from "./options";

export function getCurrencySymbol(currency?: Currency | string): string {
  const found = CurrencyOptions.find((c) => c.value === currency);
  return found?.symbol ?? "";
}

export function formatPrice(amount: number, currency: Currency | string): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol} ${amount.toLocaleString("es-MX")}`.trim();
}

export function formatPriceCompactMXN(amount: number, operation: "Sale" | "Rent"): string {
  const symbol = getCurrencySymbol("MXN");
  if (operation === "Rent") {
    return `${symbol} ${Math.round(amount).toLocaleString("es-MX")} MXN/mes`;
  }
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    const rounded = Math.round(millions * 10) / 10; // 1 decimal
    return `${symbol} ${rounded.toLocaleString("es-MX")} M MXN`;
  }
  return `${symbol} ${Math.round(amount).toLocaleString("es-MX")} MXN`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString("es-MX");
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
}

export function slugifyEs(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/gi, (m) => (m === "Ñ" ? "N" : "n"))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function getOptionLabelEs<T extends keyof typeof OptionSets>(set: T, value: (typeof OptionSets)[T][number]["value"]) {
  const found = (OptionSets[set] as any[]).find((o) => o.value === value);
  return found?.label_es ?? String(value);
}
