import { useEffect, useMemo, useRef, useState } from "react";

function hasDebugParam() {
  try {
    const sp = new URLSearchParams(window.location.search);
    return sp.get("debug") === "1";
  } catch {
    return false;
  }
}

function getReactHasOnClick(el: Element): boolean {
  // React 18 dev builds attach props on DOM nodes under a private key
  for (const k in el) {
    if (k.startsWith("__reactProps$")) {
      const props = (el as any)[k];
      if (props && typeof props.onClick === "function") return true;
    }
  }
  return false;
}

function isVisible(el: Element) {
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
  const rect = (el as HTMLElement).getBoundingClientRect?.();
  return !!rect && rect.width > 0 && rect.height > 0;
}

function countToasts(): number {
  // Best-effort: sonner renders elements with role="status" and class containing "sonner"
  const a = document.querySelectorAll('[data-sonner-toaster], .sonner, .sonner-toast, [data-sonner-toast], [role="status"]');
  return a.length;
}

export default function DebugTools() {
  const [enabled, setEnabled] = useState(hasDebugParam());
  const clicksRef = useRef<{ tag: string; className: string; node: string; time: string }[]>([]);
  const overlayRefs = useRef<HTMLElement[]>([]);
  const tooltipRefs = useRef<HTMLElement[]>([]);

  // Auto-enable if ?debug=1 changes via SPA navigation
  useEffect(() => {
    const onPop = () => setEnabled(hasDebugParam());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    document.documentElement.classList.add("__debug-clickable-active");

    // 1) Click tracer (60s)
    const handler = (ev: any) => {
      const path = (ev.composedPath && ev.composedPath()) || [ev.target];
      const node = path[0] as HTMLElement;
      const entry = {
        tag: (node?.tagName || "").toLowerCase(),
        className: node?.className || "",
        node: node ? (node.outerHTML?.slice(0, 120) || "") : "",
        time: new Date().toLocaleTimeString(),
      };
      clicksRef.current = [entry, ...clicksRef.current].slice(0, 5);
      // eslint-disable-next-line no-console
      console.log("[Debug Click]", entry);
      rerender();
    };
    window.addEventListener("click", handler, true);

    // 2) Outline clickable elements
    const styleEl = document.createElement("style");
    styleEl.setAttribute("data-debug-style", "1");
    styleEl.textContent = `
      .__debug-clickable-active button,
      .__debug-clickable-active [role="button"],
      .__debug-clickable-active a { outline: 2px dashed rgba(200,0,0,.7); outline-offset: 2px; }
    `;
    document.head.appendChild(styleEl);

    // 3) Overlay detector loop
    const runOverlayScan = () => {
      // clear previous marks
      overlayRefs.current.forEach((el) => el.style.boxShadow = "");
      tooltipRefs.current.forEach((el) => el.remove());
      overlayRefs.current = [];
      tooltipRefs.current = [];

      const buttons = Array.from(document.querySelectorAll('button, [role="button"], a')) as HTMLElement[];
      const points: { x: number; y: number; btn: HTMLElement }[] = [];
      buttons.forEach((btn) => {
        if (!isVisible(btn)) return;
        const r = btn.getBoundingClientRect();
        const x = Math.floor(r.left + r.width / 2);
        const y = Math.floor(r.top + r.height / 2);
        if (x >= 0 && y >= 0 && x <= window.innerWidth && y <= window.innerHeight) {
          points.push({ x, y, btn });
        }
      });
      const seen = new Set<Element>();
      points.forEach(({ x, y, btn }) => {
        const el = document.elementFromPoint(x, y) as HTMLElement | null;
        if (!el || el === btn) return;
        if (seen.has(el)) return;
        seen.add(el);
        const cs = window.getComputedStyle(el);
        const isOverlay = (cs.position === "absolute" || cs.position === "fixed") && cs.pointerEvents !== "none";
        if (isOverlay) {
          el.style.boxShadow = "0 0 0 2px red inset";
          overlayRefs.current.push(el);
          const tip = document.createElement("div");
          tip.textContent = `z:${cs.zIndex || 'auto'} pe:${cs.pointerEvents}`;
          tip.style.position = "fixed";
          const r = el.getBoundingClientRect();
          tip.style.left = Math.max(0, Math.min(window.innerWidth - 80, r.left + 4)) + "px";
          tip.style.top = Math.max(0, r.top + 4) + "px";
          tip.style.background = "rgba(255,0,0,.85)";
          tip.style.color = "#fff";
          tip.style.fontSize = "10px";
          tip.style.padding = "2px 4px";
          tip.style.borderRadius = "3px";
          tip.style.zIndex = "2147483647";
          tip.style.pointerEvents = "none";
          tip.setAttribute("data-debug-tip", "1");
          document.body.appendChild(tip);
          tooltipRefs.current.push(tip);
        }
      });
    };

    const interval = window.setInterval(runOverlayScan, 1000);

    return () => {
      window.removeEventListener("click", handler, true);
      styleEl.remove();
      window.clearInterval(interval);
      overlayRefs.current.forEach((el) => (el.style.boxShadow = ""));
      tooltipRefs.current.forEach((el) => el.remove());
      document.documentElement.classList.remove("__debug-clickable-active");
    };
  }, [enabled]);

  const [, setTick] = useState(0);
  const rerender = () => setTick((x) => x + 1);

  if (!enabled) return null;

  return (
    <div style={{ position: "fixed", right: 8, bottom: 8, zIndex: 2147483647 }}>
      <div style={{ background: "#111827", color: "white", padding: 8, borderRadius: 8, width: 280, boxShadow: "0 4px 16px rgba(0,0,0,.3)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <strong style={{ fontSize: 12 }}>Debug activo</strong>
          <button
            onClick={() => {
              const u = new URL(window.location.href);
              u.searchParams.delete("debug");
              window.history.replaceState(null, "", u.toString());
              setEnabled(false);
            }}
            style={{ background: "#ef4444", color: "white", borderRadius: 4, padding: "2px 6px", fontSize: 12 }}
          >Desactivar</button>
        </div>
        <div style={{ fontSize: 11, opacity: 0.9, marginBottom: 4 }}>Últimos clics:</div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, maxHeight: 160, overflow: "auto" }}>
          {clicksRef.current.map((c, i) => (
            <li key={i} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {c.time} · &lt;{c.tag}&gt; · {c.className}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
