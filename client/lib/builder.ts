export const initBuilder = () => {
  const key = (import.meta as any).env?.VITE_BUILDER_PUBLIC_API_KEY as string | undefined;
  if (!key) {
    console.warn(
      "[Builder] Falta VITE_BUILDER_PUBLIC_API_KEY; se omitirá init y la UI debe seguir funcionando.",
    );
    return;
  }
  import("@builder.io/sdk")
    .then(({ builder }) => {
      builder.init(key);
      console.info("[Builder] Init OK");
    })
    .catch((e) => console.error("[Builder] Error en init:", e));
};
