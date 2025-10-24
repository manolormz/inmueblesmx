import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";

export default function LayoutShell() {
  return (
    <div className="min-h-screen flex flex-col" data-app="kentra">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-6 md:py-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
