export const isSandbox =
  typeof window !== "undefined" && window.location !== window.parent.location;

export const env: Record<string, any> = (import.meta as any).env || {};
export const MAP_ENABLED = String(env.VITE_ENABLE_MAP || "1") === "1";
