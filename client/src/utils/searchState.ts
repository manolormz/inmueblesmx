export type LastSearch = {
  modo?: "comprar" | "renta";
  estado?: string;
  municipio?: string;
  tipo?: string;
  min?: number;
  max?: number;
};

const KEY = "kentra:lastSearch";

export function saveLastSearch(data: LastSearch) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
}

export function loadLastSearch(): LastSearch | null {
  try {
    const s = localStorage.getItem(KEY);
    return s ? (JSON.parse(s) as LastSearch) : null;
  } catch {
    return null;
  }
}
