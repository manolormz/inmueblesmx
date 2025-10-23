import { useEffect, useState } from "react";

type ZInfo = { tag: string; z: number; w: number; h: number };

export default function DebugOverlay() {
  const [top, setTop] = useState<ZInfo | null>(null);

  useEffect(() => {
    function scan() {
      let maxZ = -1;
      let el: Element | null = null;
      document.querySelectorAll<HTMLElement>("body *").forEach((e) => {
        const style = getComputedStyle(e);
        const z = Number(style.zIndex);
        if (
          !Number.isNaN(z) &&
          z > maxZ &&
          (style.position === "fixed" || style.position === "absolute")
        ) {
          maxZ = z;
          el = e;
        }
      });
      if (el) {
        const r = (el as HTMLElement).getBoundingClientRect();
        setTop({
          tag:
            el.tagName.toLowerCase() +
            ((el as HTMLElement).id ? `#${(el as HTMLElement).id}` : ""),
          z: maxZ,
          w: Math.round(r.width),
          h: Math.round(r.height),
        });
      } else {
        setTop(null);
      }
    }
    const t = setInterval(scan, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 2147483647,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          marginTop: 8,
          background: "rgba(0,0,0,.6)",
          color: "white",
          padding: "6px 10px",
          borderRadius: 8,
          fontSize: 12,
        }}
      >
        {top
          ? `Top overlay: ${top.tag} | z=${top.z} | ${top.w}x${top.h}`
          : "Sin overlays absolutos/fijos dominantes"}
      </div>
    </div>
  );
}
