"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  FileSpreadsheet,
  User,
  Sun,
  Moon,
  LogOut,
  ChevronsUpDown,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen } = useSidebar();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setImageError(false);
  }, [user?.image]);

  return (
    <Sidebar>
      <SidebarHeader>
        <div className={`flex items-center w-full ${isOpen ? "justify-between" : "justify-center"}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-6 w-6 rounded-md bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-zinc-300 flex items-center justify-center font-bold text-[11px] tracking-wider shrink-0">
              QL
            </div>
            {isOpen && (
              <div className="flex flex-col min-w-0 flex-1 text-left">
                <span className="text-[14px] font-semibold text-slate-900 dark:text-zinc-100 leading-tight truncate">
                  Querida Labs
                </span>
              </div>
            )}
          </div>
          {isOpen && (
            <ChevronsUpDown className="h-4 w-4 text-slate-400 dark:text-zinc-500 shrink-0 ml-1" />
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2 space-y-4 dark:bg-transparent">
        <div className="pt-2">
          {isOpen && (
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Ferramentas
            </p>
          )}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                icon={<LayoutDashboard className="h-4 w-4" />}
                isActive={pathname === "/dashboard"}
                onClick={() => router.push("/dashboard")}
              >
                Dashboard
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                icon={<FileSpreadsheet className="h-4 w-4" />}
                isActive={pathname === "/consolidador-xlsx"}
                onClick={() => router.push("/consolidador-xlsx")}
              >
                Consolidador XLSX
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-100 dark:border-white/10 p-2 dark:bg-transparent space-y-2">
        {user && (
          isOpen ? (
            <div
              onClick={() => router.push("/perfil")}
              className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-8 w-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden">
                  {user.image && !imageError ? (
                    <img src={user.image} alt={user.name} className="h-full w-full object-cover" onError={() => setImageError(true)} />
                  ) : (
                    user.name ? user.name.charAt(0).toUpperCase() : "U"
                  )}
                </div>
                <div className="flex flex-col min-w-0 text-left">
                  <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                    {user.email}
                  </span>
                </div>
              </div>
              <ChevronsUpDown className="h-4 w-4 text-slate-500 dark:text-zinc-400 shrink-0" />
            </div>
          ) : (
            <button
              onClick={() => router.push("/perfil")}
              className="h-8 w-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center text-xs font-semibold mx-auto overflow-hidden hover:ring-2 hover:ring-slate-300 dark:hover:ring-white/20 transition-all cursor-pointer"
              title="Meu Perfil"
            >
              {user.image && !imageError ? (
                <img src={user.image} alt={user.name} className="h-full w-full object-cover" onError={() => setImageError(true)} />
              ) : (
                user.name ? user.name.charAt(0).toUpperCase() : "U"
              )}
            </button>
          )
        )}

        <Button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          variant="outline"
          size="sm"
          className={`w-full gap-2.5 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isOpen ? "justify-start" : "justify-center px-0"
            }`}
        >
          {!mounted ? (
            <span className="h-4 w-4 animate-pulse rounded-full bg-slate-200" />
          ) : theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          {isOpen && <span>{mounted && theme === "dark" ? "Modo Claro" : "Modo Escuro"}</span>}
        </Button>

        <Button
          onClick={() => logout()}
          variant="outline"
          size="sm"
          className={`w-full gap-2.5 text-red-600 dark:text-red-400 border-red-100 dark:border-red-950/40 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 dark:hover:text-red-300 hover:border-red-200 dark:hover:border-red-900 ${isOpen ? "justify-start" : "justify-center px-0"
            }`}
        >
          <LogOut className="h-4 w-4" />
          {isOpen && <span>Sair da conta</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
