"use client";

import React from "react";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

function MainContent({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar();

  return (
    <main
      className={`flex-1 overflow-y-auto bg-slate-50/70 transition-all duration-300 ease-in-out ${
        isOpen ? "ml-64" : "ml-16"
      }`}
    >
      <div className="min-h-full p-6 md:p-8 max-w-7xl mx-auto">{children}</div>
    </main>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans antialiased overflow-hidden">
        <AppSidebar />
        <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
}
