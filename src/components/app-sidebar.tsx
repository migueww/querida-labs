"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen } = useSidebar();
  const { user, logout } = useAuth();

  return (
    <Sidebar className="flex flex-col border-r border-slate-200 bg-white">
      <SidebarHeader className="border-b border-slate-100 py-3">
        <div className="flex items-center justify-between w-full px-1">
          {isOpen && (
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-xs">
                QL
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-900 leading-tight">
                  Querida Labs
                </span>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                  Internal Tools
                </span>
              </div>
            </div>
          )}
          <SidebarTrigger />
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2 space-y-4">
        <div className="px-2 pt-2">
          {isOpen && (
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Ferramentas
            </p>
          )}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="7" height="9" x="3" y="3" rx="1" />
                    <rect width="7" height="5" x="14" y="3" rx="1" />
                    <rect width="7" height="9" x="14" y="12" rx="1" />
                    <rect width="7" height="5" x="3" y="16" rx="1" />
                  </svg>
                }
                isActive={pathname === "/dashboard"}
                onClick={() => router.push("/dashboard")}
              >
                Dashboard
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                    <path d="M16 13H8" />
                    <path d="M16 17H8" />
                    <path d="M10 9H8" />
                  </svg>
                }
                isActive={pathname === "/consolidador-xlsx"}
                onClick={() => router.push("/consolidador-xlsx")}
              >
                Consolidador XLSX
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-100 p-3 space-y-3">
        {user && isOpen && (
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200/60">
            <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-medium text-slate-900 truncate">
                {user.name}
              </span>
              <span className="text-[11px] text-slate-500 truncate">
                {user.email}
              </span>
            </div>
          </div>
        )}

        <Button
          onClick={() => logout()}
          variant="outline"
          size="sm"
          className={`w-full gap-2.5 text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200 ${
            isOpen ? "justify-start" : "justify-center px-0"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {isOpen && <span>Sair da conta</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
