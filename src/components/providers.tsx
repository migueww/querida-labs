"use client";

import React from "react";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/use-auth";
import { ToastProvider } from "@/hooks/use-toast";
import { ToastContainer } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <ToastProvider>
          {children}
          <ToastContainer />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
