import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Publish from "./pages/Publish";
import Search from "./pages/Search";
import Property from "./pages/Property";
import Maintenance from "./pages/Maintenance";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/Dashboard";
import QAButtons from "./pages/qa/Buttons";
import Autotest from "./pages/qa/Autotest";
import DebugTools from "./debug/DebugTools";
import { AuthProvider } from "./auth/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          {/* Debug overlay auto-mounts if ?debug=1 */}
          <DebugTools />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/publish" element={<Publish />} />
            <Route path="/search" element={<Search />} />
            <Route path="/property/:slug" element={<Property />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/qa/buttons" element={<QAButtons />} />
            <Route path="/qa/autotest" element={<Autotest />} />
            <Route path="/dashboard" element={<Dashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
