"use client";

import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-zinc-50 font-sans antialiased overflow-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden relative z-0">
          {/* Watermark Empty State */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center -z-10">
            <span className="text-[240px] font-black text-slate-900/[0.03] dark:text-white/[0.02] select-none tracking-tighter">
              QL
            </span>
          </div>

          <header className="flex h-14 shrink-0 items-center gap-3 px-6 bg-transparent z-10">
            <SidebarTrigger />
            <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10" />
            <span className="text-[15px] text-slate-700 dark:text-zinc-200 font-semibold leading-none mt-[2px] tracking-tight">Querida Labs</span>
          </header>
          <main className="flex-1 overflow-y-auto">
            <div className="min-h-full p-6 md:p-8 max-w-7xl mx-auto z-10 relative">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
