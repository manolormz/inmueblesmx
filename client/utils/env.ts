export const isSandbox =
  typeof window !== "undefined" &&
  (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

export const env: Record<string, any> = (import.meta as any).env || {};
export const MAP_ENABLED = String(env.VITE_ENABLE_MAP || "1") === "1";
