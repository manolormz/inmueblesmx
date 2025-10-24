import { createRoot } from "react-dom/client";
import "./error-overlay";
import App from "./App";
import { initBuilder } from "./lib/builder";

initBuilder();

// PING visible para confirmar montaje
const banner = document.createElement("div");
banner.id = "kentra-ping";
banner.textContent = "Kentra is mounting…";
banner.style.cssText =
  "position:fixed;left:8px;bottom:8px;background:#E7E3D0;color:#1F1F1B;padding:6px 10px;border-radius:12px;font:12px/1.2 Inter,system-ui;z-index:99999;opacity:.85";
document.body.appendChild(banner);

const el = document.getElementById("root") || document.body;
createRoot(el as HTMLElement).render(<App />);
