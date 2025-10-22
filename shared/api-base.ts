export function getApiBase(): string {
  const env: any = (import.meta as any).env || {};
  const fromEnv = String(env.VITE_SITE_URL || "").replace(/\/+$/g, "");
  const isBrowser = typeof window !== "undefined";
  const isBuilderHost = isBrowser && /\.builder\.my$/.test(window.location.host);
  if (fromEnv) return fromEnv;
  if (isBuilderHost) return "http://localhost:5173";
  return isBrowser ? window.origin : "http://localhost:5173";
}
export const API_BASE = getApiBase();
