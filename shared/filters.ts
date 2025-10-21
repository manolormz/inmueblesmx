export type PriceOption = { key: string; label: string; priceMin?: number; priceMax?: number };

export function getPriceOptionsMXNByOperation(operation: "Sale" | "Rent"): PriceOption[] {
  if (operation === "Rent") {
    return [
      { key: "any", label: "Cualquier precio" },
      { key: "lte-10k", label: "≤ 10 mil/mes", priceMax: 10_000 },
      { key: "10-15k", label: "10 – 15 mil/mes", priceMin: 10_000, priceMax: 15_000 },
      { key: "15-20k", label: "15 – 20 mil/mes", priceMin: 15_000, priceMax: 20_000 },
      { key: "20-30k", label: "20 – 30 mil/mes", priceMin: 20_000, priceMax: 30_000 },
      { key: "30-50k", label: "30 – 50 mil/mes", priceMin: 30_000, priceMax: 50_000 },
      { key: "50-80k", label: "50 – 80 mil/mes", priceMin: 50_000, priceMax: 80_000 },
      { key: "gte-80k", label: "≥ 80 mil/mes", priceMin: 80_000 },
    ];
  }
  return [
    { key: "any", label: "Cualquier precio" },
    { key: "lte-1m", label: "≤ 1 millón", priceMax: 1_000_000 },
    { key: "1-2m", label: "1 – 2 millones", priceMin: 1_000_000, priceMax: 2_000_000 },
    { key: "2-3m", label: "2 – 3 millones", priceMin: 2_000_000, priceMax: 3_000_000 },
    { key: "3-5m", label: "3 – 5 millones", priceMin: 3_000_000, priceMax: 5_000_000 },
    { key: "5-10m", label: "5 – 10 millones", priceMin: 5_000_000, priceMax: 10_000_000 },
    { key: "10-20m", label: "10 – 20 millones", priceMin: 10_000_000, priceMax: 20_000_000 },
    { key: "gte-20m", label: "≥ 20 millones", priceMin: 20_000_000 },
  ];
}
