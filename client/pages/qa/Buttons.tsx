import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

function isVisible(el: Element) {
  const style = window.getComputedStyle(el);
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    parseFloat(style.opacity) === 0
  )
    return false;
  const rect = (el as HTMLElement).getBoundingClientRect?.();
  return !!rect && rect.width > 0 && rect.height > 0;
}

function getReactHasOnClick(el: Element): boolean {
  for (const k in el) {
    if (k.startsWith("__reactProps$")) {
      const props = (el as any)[k];
      if (props && typeof props.onClick === "function") return true;
    }
  }
  return false;
}

function findDataLoc(el: Element | null): string | null {
  let cur: Element | null = el;
  while (cur) {
    const loc = (cur as HTMLElement).getAttribute?.("data-loc");
    if (loc) return loc;
    cur = cur.parentElement;
  }
  return null;
}

function countToasts(): number {
  const a = document.querySelectorAll(
    '[data-sonner-toaster], .sonner, .sonner-toast, [data-sonner-toast], [role="status"]',
  );
  return a.length;
}

export default function QAButtons() {
  if (import.meta.env.PROD) return <Navigate to="/" replace />;

  const [rows, setRows] = useState<any[]>([]);
  const [results, setResults] = useState<Record<number, "ok" | "none">>({});

  const scan = () => {
    const nodes = Array.from(
      document.querySelectorAll('button, [role="button"], a'),
    ) as HTMLElement[];
    const rows = nodes
      .filter((el) => isVisible(el))
      .map((el) => {
        const text = (
          el.innerText ||
          el.getAttribute("aria-label") ||
          ""
        ).trim();
        const href = el.getAttribute("href") || el.getAttribute("to") || "";
        const hasClick =
          !!(el as any).onclick || getReactHasOnClick(el) || !!href;
        const loc = findDataLoc(el);
        return { el, text, href, hasClick, loc };
      });
    setRows(rows);
  };

  useEffect(() => {
    scan();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">QA · Botones</h1>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">Total: {rows.length}</div>
            <div className="text-sm text-green-700">
              Con handler: {rows.filter((r) => r.hasClick).length}
            </div>
            <div className="text-sm text-red-700">
              Sin handler: {rows.filter((r) => !r.hasClick).length}
            </div>
            <Button
              onClick={() => {
                setResults({});
                scan();
              }}
            >
              Re-escanear
            </Button>
          </div>
        </div>
        <div className="text-sm text-gray-600 mb-4">
          Lista de elementos clicables visibles. Los que no tengan handler
          aparecen en rojo. Tras probar, verás un distintivo "OK" en verde si el
          click navegó o mostró toast.
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Texto</th>
                <th className="py-2 pr-4">Archivo</th>
                <th className="py-2 pr-4">Handler</th>
                <th className="py-2 pr-4">Acción</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr
                  key={idx}
                  className={`border-b ${r.hasClick ? "" : "bg-red-50"}`}
                >
                  <td className="py-2 pr-4 whitespace-nowrap max-w-xs overflow-hidden text-ellipsis">
                    {r.text || "(sin texto)"}
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap text-gray-500">
                    {r.loc || "—"}
                  </td>
                  <td className="py-2 pr-4">{r.hasClick ? "Sí" : "No"}</td>
                  <td className="py-2 pr-4 flex items-center gap-2">
                    {results[idx] === "ok" && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs">
                        OK
                      </span>
                    )}
                    {results[idx] === "none" && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-100 text-red-800 text-xs">
                        Sin efecto
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const beforePath =
                          window.location.pathname +
                          window.location.search +
                          window.location.hash;
                        const beforeToasts = countToasts();
                        let navigated = false;
                        let toastShown = false;
                        try {
                          r.el.scrollIntoView({ block: "center" });
                        } catch {}
                        try {
                          r.el.click();
                        } catch {}
                        window.setTimeout(() => {
                          const afterPath =
                            window.location.pathname +
                            window.location.search +
                            window.location.hash;
                          if (afterPath !== beforePath) navigated = true;
                          const afterToasts = countToasts();
                          if (afterToasts > beforeToasts) toastShown = true;
                          setResults((prev) => ({
                            ...prev,
                            [idx]: navigated || toastShown ? "ok" : "none",
                          }));
                        }, 400);
                      }}
                    >
                      Probar click
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </div>
  );
}
