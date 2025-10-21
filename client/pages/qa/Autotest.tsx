import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/AuthContext";

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
function waitFor(predicate: () => boolean, timeout = 3000, interval = 100): Promise<boolean> {
  return new Promise((resolve) => {
    const start = Date.now();
    const id = window.setInterval(() => {
      if (predicate()) { window.clearInterval(id); resolve(true); }
      else if (Date.now() - start > timeout) { window.clearInterval(id); resolve(false); }
    }, interval);
  });
}
function text(el: Element | null): string { return (el?.textContent || "").trim(); }
function getToasts(): string[] {
  const nodes = Array.from(document.querySelectorAll('[data-sonner-toast], .sonner-toast, [data-sonner-toaster] [role="status"], [role="status"]')) as HTMLElement[];
  return nodes.map((n) => n.innerText.trim()).filter(Boolean);
}

type StepResult = {
  name: string;
  route: string;
  action: string;
  expected: string;
  actual: string;
  status: "PASS" | "FAIL" | "SKIP";
  notes?: string;
};

export default function Autotest() {
  if (import.meta.env.PROD) return <Navigate to="/" replace />;
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<StepResult[]>([]);
  const runIdRef = useRef(0);

  async function run() {
    setRunning(true);
    setResults([]);
    const push = (r: StepResult) => setResults((prev) => [...prev, r]);
    const runId = ++runIdRef.current;

    // Helper: verify location
    const expectSearch = async (label: string, expected: Record<string,string>) => {
      const ok = await waitFor(() => {
        const sp = new URLSearchParams(window.location.search);
        return Object.entries(expected).every(([k,v]) => sp.get(k) === v);
      }, 2000);
      push({ name: label, route: location.pathname + location.search, action: "Verificar querystring", expected: JSON.stringify(expected), actual: window.location.search, status: ok ? "PASS" : "FAIL" });
      return ok;
    };

    // 1) Home -> Comprar
    navigate("/");
    await waitFor(() => document.querySelector('[data-loc="HeroSearch"]'));
    const comprarBtn = Array.from(document.querySelectorAll('[data-loc="HeroSearch"]')).find((el) => /Comprar/i.test(text(el))) as HTMLElement | undefined;
    if (comprarBtn) comprarBtn.click();
    await waitFor(() => location.pathname === "/search");
    await expectSearch("Home → Comprar", { operation: "Sale", status: "Published" });

    // 2) Home -> Rentar
    navigate("/");
    await waitFor(() => document.querySelector('[data-loc="HeroSearch"]'));
    const rentarBtn = Array.from(document.querySelectorAll('[data-loc="HeroSearch"]')).find((el) => /Rentar/i.test(text(el))) as HTMLElement | undefined;
    if (rentarBtn) rentarBtn.click();
    await waitFor(() => location.pathname === "/search");
    await expectSearch("Home → Rentar", { operation: "Rent", status: "Published" });

    // 3) Home -> Buscar (default)
    navigate("/");
    await waitFor(() => document.querySelector('[data-loc="HeroSearch"]'));
    const buscarBtn = Array.from(document.querySelectorAll('[data-loc="HeroSearch"]')).find((el) => /Buscar/i.test(text(el))) as HTMLElement | undefined;
    if (buscarBtn) buscarBtn.click();
    await waitFor(() => location.pathname === "/search");
    // status should be Published at least
    const sp = new URLSearchParams(location.search);
    const okBuscar = sp.get("status") === "Published";
    push({ name: "Home → Buscar", route: location.pathname + location.search, action: "Buscar por defecto", expected: "status=Published", actual: location.search, status: okBuscar ? "PASS" : "FAIL" });

    // 4) /search Sale -> first card -> property
    navigate({ pathname: "/search", search: "?operation=Sale&status=Published" });
    await waitFor(() => document.querySelector('[data-loc="SearchCard"] a'));
    const firstCard = document.querySelector('[data-loc="SearchCard"] a') as HTMLAnchorElement | null;
    const href = firstCard?.getAttribute("href") || "";
    if (firstCard) firstCard.click();
    const okProperty = await waitFor(() => /^\/property\//.test(location.pathname));
    push({ name: "Search → Card", route: location.pathname + location.search, action: "Click primer resultado", expected: "Ir a /property/[slug]", actual: location.pathname, status: okProperty ? "PASS" : "FAIL" });

    // 5) property: enviar lead
    await waitFor(() => document.querySelector('form [id="name"]'));
    const beforeToasts = getToasts().length;
    (document.getElementById("name") as HTMLInputElement).value = "QA Bot";
    (document.getElementById("email") as HTMLInputElement).value = "qa@example.com";
    (document.getElementById("message") as HTMLTextAreaElement).value = "Estoy interesado";
    // trigger events
    (document.getElementById("name") as HTMLInputElement).dispatchEvent(new Event("input", { bubbles: true }));
    (document.getElementById("email") as HTMLInputElement).dispatchEvent(new Event("input", { bubbles: true }));
    (document.getElementById("message") as HTMLTextAreaElement).dispatchEvent(new Event("input", { bubbles: true }));
    const leadBtn = document.querySelector('[data-loc="LeadSubmit"]') as HTMLButtonElement | null;
    leadBtn?.click();
    await sleep(500);
    const afterToasts = getToasts();
    const toastShown = afterToasts.length > beforeToasts;
    push({ name: "Property → Lead", route: location.pathname, action: "Enviar lead", expected: "Toast éxito", actual: afterToasts.join(" | ") || "(sin toast)", status: toastShown ? "PASS" : "FAIL" });

    // 6) Publish flow (optional)
    if (currentUser && currentUser.role !== "buyer") {
      navigate("/publish");
      await waitFor(() => document.querySelector('form button[type="submit"]'));
      // minimal fields
      const title = `QA Propiedad ${Date.now()}`;
      (document.querySelector('input[placeholder="Casa en Polanco"]') as HTMLInputElement).value = title;
      (document.querySelector('input[type="number"][placeholder="2500000"]') as HTMLInputElement).value = "2500000";
      // selects (currency/operation/type) — pick first options by simulating clicks
      const clickFirst = async (triggerSel: string) => {
        const trig = document.querySelector(triggerSel) as HTMLElement | null;
        trig?.click();
        await sleep(50);
        const item = document.querySelector('[role="option"]') as HTMLElement | null;
        item?.click();
      };
      await clickFirst('[data-state] button'); // may not be stable, try fallback to native selects if any
      // Fallback: ensure currency via custom select: pick first menu option elements
      const selects = Array.from(document.querySelectorAll('[role="combobox"], [data-radix-select-trigger]')) as HTMLElement[];
      for (const s of selects) { s.click(); await sleep(50); const o = document.querySelector('[role="option"]'); (o as HTMLElement | null)?.click(); await sleep(40); }
      const submit = document.querySelector('[data-loc="PublishSubmit"]') as HTMLButtonElement | null;
      const before = getToasts().length;
      submit?.click();
      const redirected = await waitFor(() => /^\/property\//.test(location.pathname), 4000);
      const toasts = getToasts();
      const failedServer = toasts.some((t) => /Falta configuración del servidor/i.test(t));
      if (!redirected && failedServer) {
        push({ name: "Publish → Crear borrador", route: location.pathname, action: "Enviar formulario", expected: "Redirigir a detalle", actual: toasts.join(" | "), status: "SKIP", notes: "Servidor no configurado" });
      } else {
        push({ name: "Publish → Crear borrador", route: location.pathname, action: "Enviar formulario", expected: "Redirigir a detalle", actual: location.pathname, status: redirected ? "PASS" : "FAIL" });
        if (redirected) {
          const pb = document.querySelector('[data-loc="PublishButton"]') as HTMLButtonElement | null;
          pb?.click();
          await sleep(300);
          const okToast = getToasts().some((t) => /publicada con éxito/i.test(t));
          push({ name: "Detalle → Publicar", route: location.pathname, action: "Click Publicar", expected: "Toast éxito", actual: getToasts().join(" | "), status: okToast ? "PASS" : "FAIL" });
        }
      }
    } else {
      push({ name: "Publish (omitido)", route: location.pathname, action: "No permisos", expected: "Sesión agente/empresa", actual: "Usuario no autenticado o comprador", status: "SKIP" });
    }

    if (runIdRef.current === runId) setRunning(false);
  }

  const reportText = useMemo(() => {
    const lines = results.map((r) => `${r.status} | ${r.name} | ${r.action} | ${r.expected} -> ${r.actual}${r.notes ? ` | ${r.notes}` : ""}`);
    return lines.join("\n");
  }, [results]);

  async function copyReport() {
    const payload = JSON.stringify({ startedAt: new Date().toISOString(), results }, null, 2) + "\n\n" + reportText;
    await navigator.clipboard.writeText(payload);
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">QA · Autotest</h1>
          <div className="flex items-center gap-2">
            <Button onClick={run} disabled={running}>{running ? "Ejecutando…" : "Ejecutar de nuevo"}</Button>
            <Button variant="outline" onClick={copyReport} disabled={!results.length}>Copiar reporte</Button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-4">Pruebas automatizadas de navegación y acciones principales. Solo disponible en desarrollo.</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Paso</th>
                <th className="py-2 pr-4">Ruta</th>
                <th className="py-2 pr-4">Acción</th>
                <th className="py-2 pr-4">Esperado</th>
                <th className="py-2 pr-4">Actual</th>
                <th className="py-2 pr-4">Estado</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2 pr-4 whitespace-nowrap">{r.name}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">{r.route}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">{r.action}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">{r.expected}</td>
                  <td className="py-2 pr-4 whitespace-nowrap max-w-md overflow-hidden text-ellipsis">{r.actual}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-xs ${r.status==='PASS'?'bg-green-100 text-green-800':r.status==='FAIL'?'bg-red-100 text-red-800':'bg-yellow-100 text-yellow-800'}`}>{r.status}</span>
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
