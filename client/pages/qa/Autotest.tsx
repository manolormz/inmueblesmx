import { useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function waitFor(predicate: () => boolean, timeout = 5000, interval = 100): Promise<boolean> {
  return new Promise((resolve) => {
    const start = Date.now();
    const id = window.setInterval(() => {
      if (predicate()) { window.clearInterval(id); resolve(true); }
      else if (Date.now() - start > timeout) { window.clearInterval(id); resolve(false); }
    }, interval);
  });
}

async function waitForEl<T extends Element = Element>(selector: string, timeout = 5000): Promise<T | null> {
  const ok = await waitFor(() => !!document.querySelector(selector), timeout, 100);
  return ok ? (document.querySelector(selector) as T) : null;
}

function text(el: Element | null): string { return (el?.textContent || "").trim(); }

function normalizeLabel(s: string): string {
  return s
    .replace(/\u00A0/g, " ")
    .replace(/\s*[\u2013\u2014-]\s*/g, " – ")
    .replace(/\s+/g, " ")
    .trim();
}

type StepResult = {
  name: string;
  route: string;
  action: string;
  expected: string;
  actual: string;
  status: "PASS" | "FAIL" | "SKIP";
};

export default function Autotest() {
  if (import.meta.env.PROD) return <Navigate to="/" replace />;
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<StepResult[]>([]);
  const runIdRef = useRef(0);

  async function run() {
    setRunning(true);
    setResults([]);
    const push = (r: StepResult) => setResults((prev) => [...prev, r]);
    const runId = ++runIdRef.current;

    const expectUrlHas = async (label: string, expected: Record<string,string>) => {
      const ok = await waitFor(() => {
        const sp = new URLSearchParams(window.location.search);
        return Object.entries(expected).every(([k,v]) => sp.get(k) === v);
      }, 2500);
      push({ name: label, route: location.pathname + location.search, action: "Verificar querystring", expected: JSON.stringify(expected), actual: window.location.search, status: ok ? "PASS" : "FAIL" });
      return ok;
    };

    const getChipLabels = (): string[] => Array.from(document.querySelectorAll('[data-loc="SearchChips"] .px-3 span'))
      .map((el) => text(el))
      .filter(Boolean);

    // Home → Rentar
    navigate("/");
    await waitFor(() => document.querySelector('[data-loc="HeroTabs"]'));
    const rentTab = Array.from(document.querySelectorAll('[data-loc="HeroTabs"] button')).find((b) => /Rentar/i.test(text(b))) as HTMLButtonElement | undefined;
    rentTab?.click();
    // Validar opciones de precio (Renta)
    const priceSel = document.querySelector('[data-loc="HeroPrice"] select') as HTMLSelectElement | null;
    await waitFor(() => !!priceSel && priceSel.options.length >= 8);
    const labels = priceSel ? Array.from(priceSel.options).map((o) => normalizeLabel(o.text)) : [];
    const rentMust = [
      "≤ 10 mil/mes","10 – 15 mil/mes","15 – 20 mil/mes",
      "20 – 30 mil/mes","30 – 50 mil/mes","50 – 80 mil/mes","≥ 80 mil/mes"
    ].map(normalizeLabel);
    const okRentOptions = labels.length >= 8 && rentMust.every((l) => labels.includes(l));
    push({ name: "Home → Rentar", route: location.pathname + location.search, action: "Opciones de precio (Renta)", expected: rentMust.join(", "), actual: labels.join(" | "), status: okRentOptions ? "PASS" : "FAIL" });

    // Elegir 15 – 20 mil/mes en Home y Buscar
    if (priceSel) {
      const opt = Array.from(priceSel.options).find((o) => /15\s–\s20 mil\/mes/.test(o.text));
      if (opt) { priceSel.value = opt.value; priceSel.dispatchEvent(new Event("change", { bubbles: true })); }
    }
    const buscar = document.querySelector('[data-loc="HeroSearchBtn"]') as HTMLButtonElement | null;
    buscar?.click();
    await waitFor(() => location.pathname === "/search");
    await expectUrlHas("Rentar: rango 15–20k", { operation: "Rent", status: "Published", priceMin: "15000", priceMax: "20000" });
    const chips1 = getChipLabels();
    const hasChipRent = chips1.some((c) => /15\s–\s20 mil\/mes/.test(c));
    push({ name: "Chips (Renta)", route: location.pathname + location.search, action: "Ver etiqueta de precio", expected: "15 – 20 mil/mes", actual: chips1.join(" | "), status: hasChipRent ? "PASS" : "FAIL" });

    // Precio primer resultado termina con MXN/mes
    await waitFor(() => !!document.querySelector('[data-loc="SearchCard"]'));
    const firstCardRent = document.querySelector('[data-loc="SearchCard"]');
    if (!firstCardRent) {
      push({ name: "Precio formato (Renta)", route: location.pathname + location.search, action: "Validar sufijo", expected: "… MXN/mes", actual: "Sin resultados", status: "SKIP" });
    } else {
      const firstPriceRent = (firstCardRent as HTMLElement).querySelector('.text-blue-700') as HTMLElement | null;
      const priceTextRent = text(firstPriceRent);
      const endsRent = /MXN\/mes$/.test(priceTextRent);
      push({ name: "Precio formato (Renta)", route: location.pathname + location.search, action: "Validar sufijo", expected: "… MXN/mes", actual: priceTextRent, status: endsRent ? "PASS" : "FAIL" });
    }

    // /search → Cambiar a Comprar (nav header)
    const headerComprar = Array.from(document.querySelectorAll('header a[role="link"], header a')).find((a) => /Comprar/.test(text(a))) as HTMLAnchorElement | undefined;
    headerComprar?.click();
    await waitFor(() => /operation=Sale/.test(location.search));
    const priceSelSearch = await waitForEl<HTMLSelectElement>('[data-loc="SearchBar"] select[name="price"]');
    await waitFor(() => !!priceSelSearch && priceSelSearch.options.length >= 8);
    const labelsSale = priceSelSearch ? Array.from(priceSelSearch.options).map((o) => normalizeLabel(o.text)) : [];
    const saleMust = [
      "≤ 1 millón","1 – 2 millones","2 – 3 millones",
      "3 – 5 millones","5 – 10 millones","10 – 20 millones","≥ 20 millones"
    ].map(normalizeLabel);
    const okSaleOptions = labelsSale.length >= 8 && saleMust.every((l) => labelsSale.includes(l));
    const spSale = new URLSearchParams(location.search);
    const resetOk = !spSale.get("priceMin") && !spSale.get("priceMax");
    push({ name: "/search → Comprar", route: location.pathname + location.search, action: "Opciones y reset precio (Venta)", expected: saleMust.join(", "), actual: `${labelsSale.join(" | ")} || reset:${resetOk}`, status: okSaleOptions && resetOk ? "PASS" : "FAIL" });

    // Elegir 3 – 5 millones y validar chip/URL
    if (priceSelSearch) {
      const opt2 = Array.from(priceSelSearch.options).find((o) => /3\s–\s5 millones/.test(o.text));
      if (opt2) { priceSelSearch.value = opt2.value; priceSelSearch.dispatchEvent(new Event("change", { bubbles: true })); }
    }
    await expectUrlHas("Venta: rango 3–5M", { operation: "Sale", status: "Published", priceMin: "3000000", priceMax: "5000000" });
    const chips2 = getChipLabels();
    const hasChipSale = chips2.some((c) => /3\s–\s5 millones/.test(c));
    push({ name: "Chips (Venta)", route: location.pathname + location.search, action: "Ver etiqueta de precio", expected: "3 – 5 millones", actual: chips2.join(" | "), status: hasChipSale ? "PASS" : "FAIL" });

    // Ordenar por Precio descendente
    const orderSel = await waitForEl<HTMLSelectElement>('[data-loc="SearchBar"] select[name="order"]');
    if (orderSel) { orderSel.value = 'price_desc'; orderSel.dispatchEvent(new Event('change', { bubbles: true })); }
    await expectUrlHas("Orden precio desc", { sort: "price_desc" });

    // Verificar formato M MXN en primera tarjeta
    await waitFor(() => document.querySelector('[data-loc="SearchCard"] .text-blue-700'));
    const firstPriceSale = document.querySelector('[data-loc="SearchCard"] .text-blue-700') as HTMLElement | null;
    const priceTextSale = text(firstPriceSale);
    const reMillions = /^\$[\d.,]+(?:\.\d)?\s*M\s*MXN$/;
    push({ name: "Precio formato (Venta)", route: location.pathname + location.search, action: "Validar millones compactos", expected: reMillions.toString(), actual: priceTextSale, status: reMillions.test(priceTextSale) ? "PASS" : "FAIL" });

    // Selección de ubicación: Roma Norte (Colonia) en Home y Buscar
    navigate("/");
    await waitFor(() => document.querySelector('[data-loc="HeroLocationInput"]'));
    const locInput = document.querySelector('[data-loc="HeroLocationInput"]') as HTMLInputElement | null;
    if (locInput) {
      locInput.focus();
      locInput.value = "Roma";
      locInput.dispatchEvent(new Event('input', { bubbles: true }));
      const okList = await waitFor(() => !!document.querySelector('[data-loc="HeroLocationList"] [data-loc="HeroLocationItem"]'));
      let clicked = false;
      if (okList) {
        const items = Array.from(document.querySelectorAll('[data-loc="HeroLocationList"] [data-loc="HeroLocationItem"]')) as HTMLLIElement[];
        const romaItem = items.find((li) => /Roma\s*Norte/i.test(text(li)) || /Colonia/.test(text(li)));
        if (romaItem) { (romaItem as any).dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); clicked = true; }
      }
      const btn = document.querySelector('[data-loc="HeroSearchBtn"]') as HTMLButtonElement | null;
      btn?.click();
      await waitFor(() => location.pathname === "/search");
      const spLoc = new URLSearchParams(location.search);
      const gotNeigh = spLoc.get('neighborhoodSlug') === 'roma-norte';
      const gotCity = spLoc.get('locationSlug') === 'ciudad-de-mexico';
      const okSlug = gotNeigh || gotCity;
      push({ name: "Ubicación seleccionada", route: location.pathname + location.search, action: "URL con slug", expected: "neighborhoodSlug=roma-norte o locationSlug=ciudad-de-mexico", actual: location.search, status: okSlug ? "PASS" : "FAIL" });
      // Chip de ubicación
      await waitFor(() => document.querySelector('[data-loc="SearchChips"]'));
      const chipsLoc = getChipLabels();
      const hasLocChip = chipsLoc.some((c) => /Ubicación:/.test(c) && (/Roma\s*Norte/.test(c) || /Ciudad de México/.test(c)));
      push({ name: "Chip de ubicación", route: location.pathname + location.search, action: "Etiqueta correcta", expected: "Ubicación: Col. Roma Norte, Ciudad de México (o Ciudad de México)", actual: chipsLoc.join(" | "), status: hasLocChip ? "PASS" : "FAIL" });
      // Quitar chip
      const xBtn = document.querySelector('[data-loc="SearchChips"] button[aria-label^="Quitar"]') as HTMLButtonElement | null;
      xBtn?.click();
      await sleep(150);
      const spAfter = new URLSearchParams(location.search);
      const removed = !spAfter.get('neighborhoodSlug') && !spAfter.get('locationSlug');
      push({ name: "Quitar chip ubicación", route: location.pathname + location.search, action: "Slugs removidos", expected: "sin neighborhoodSlug/locationSlug", actual: location.search, status: removed ? "PASS" : "FAIL" });
    }

    // Restablecer todo (asegurar que aparezca)
    let resetBtn = document.querySelector('[data-loc="SearchResetAll"]') as HTMLButtonElement | null;
    if (!resetBtn) {
      const typeSel = document.querySelector('select#type') as HTMLSelectElement | null;
      if (typeSel && typeSel.options.length > 1) { typeSel.value = typeSel.options[1].value; typeSel.dispatchEvent(new Event('change', { bubbles: true })); }
      await sleep(150);
      resetBtn = document.querySelector('[data-loc="SearchResetAll"]') as HTMLButtonElement | null;
    }
    resetBtn?.click();
    await sleep(150);
    const spReset = new URLSearchParams(location.search);
    const onlyMinimal = spReset.toString() === "status=Published&page=1" || (spReset.get('status') === 'Published' && spReset.get('page') === '1' && Array.from(spReset.keys()).length <= 2);
    const chipsAfter = getChipLabels();
    push({ name: "Restablecer todo", route: location.pathname + location.search, action: "Reset filtros", expected: "status=Published&page=1 y sin chips", actual: `${location.search} || chips: ${chipsAfter.join(" | ")}`, status: onlyMinimal && chipsAfter.length === 0 ? "PASS" : "FAIL" });

    if (runIdRef.current === runId) setRunning(false);
  }

  const reportText = useMemo(() => {
    const lines = results.map((r) => `${r.status} | ${r.name} | ${r.action} | ${r.expected} -> ${r.actual}`);
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
        <p className="text-sm text-gray-600 mb-4">Pruebas de rangos de precio MXN (adaptativos) y visualización. Solo desarrollo.</p>
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
        {(() => {
          const summary = (() => {
            const pass = results.filter(r => r.status === "PASS").length;
            const fail = results.filter(r => r.status === "FAIL").length;
            const skip = results.filter(r => r.status === "SKIP").length;
            return { pass, fail, skip, total: results.length };
          })();
          return (
            <div className="mt-4 text-sm">
              <span className="mr-3 px-2 py-1 rounded bg-green-100 text-green-800">PASS: {summary.pass}</span>
              <span className="mr-3 px-2 py-1 rounded bg-red-100 text-red-800">FAIL: {summary.fail}</span>
              <span className="mr-3 px-2 py-1 rounded bg-yellow-100 text-yellow-800">SKIP: {summary.skip}</span>
              <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">TOTAL: {summary.total}</span>
            </div>
          );
        })()}
      </main>
      <Footer />
    </div>
  );
}
