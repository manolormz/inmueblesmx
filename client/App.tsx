import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LayoutShell from "./components/LayoutShell";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Publish from "./pages/Publish";
import Search from "./pages/Search";
import Property from "./pages/Property";
import Maintenance from "./pages/Maintenance";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/Dashboard";
import DashboardPropertyEdit from "./pages/dashboard/PropertyEdit";
import QAButtons from "./pages/qa/Buttons";
import Autotest from "./pages/qa/Autotest";
import DebugTools from "./debug/DebugTools";
import { AuthProvider } from "./auth/AuthContext";
import Lead from "./pages/Lead";
import Visit from "./pages/Visit";
import Agency from "./pages/Agency";
import LoginTop from "./pages/login";
import RegisterTop from "./pages/register";
import Buscar from "./pages/Buscar";

const queryClient = new QueryClient();

// Log global de errores (solo dev)
if (import.meta.env.DEV) {
  window.addEventListener("error", (e) =>
    console.error(
      "window.onerror:",
      (e as any).error || (e as any).message || e,
    ),
  );
  window.addEventListener("unhandledrejection", (e) =>
    console.error("unhandledrejection:", (e as any).reason),
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LayoutShell>
          {/* Debug overlay auto-mounts if ?debug=1 */}
          <DebugTools />
          {/**
          import DebugOverlay from '@/components/DebugOverlay';
          <DebugOverlay />
          **/}
          <Routes>
            <Route path="/" element={<Navigate to="/buscar" replace />} />
            <Route path="/publish" element={<Publish />} />
            <Route path="/search" element={<Search />} />
            <Route path="/property/:slug" element={<Property />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/login" element={<LoginTop />} />
            <Route path="/register" element={<RegisterTop />} />
            <Route path="/lead" element={<Lead />} />
            <Route path="/visita" element={<Visit />} />
            <Route path="/agencia" element={<Agency />} />
            <Route path="/qa/buttons" element={<QAButtons />} />
            <Route path="/qa/autotest" element={<Autotest />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/buscar" element={<Buscar />} />
            <Route
              path="/dashboard/properties/:slug/edit"
              element={<DashboardPropertyEdit />}
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<Navigate to="/buscar" replace />} />
          </Routes>
          </LayoutShell>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
