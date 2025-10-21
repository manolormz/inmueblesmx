export default function onClickLog(id: string, fn?: () => void) {
  return () => {
    if (!import.meta.env.PROD) {
      // eslint-disable-next-line no-console
      console.log("🟦 click:", id);
    }
    try {
      fn?.();
    } catch (e) {}
  };
}
