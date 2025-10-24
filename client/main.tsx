import { createRoot } from "react-dom/client";
import App from "./App";
import { initBuilder } from "./lib/builder";

initBuilder();

const el = document.getElementById("root") || document.body;
createRoot(el as HTMLElement).render(<App />);
