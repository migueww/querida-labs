"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SidebarContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggle: () => void;
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(
  undefined
);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
}

interface SidebarProviderProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function SidebarProvider({
  children,
  defaultOpen = true,
}: SidebarProviderProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  const toggle = React.useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const value = React.useMemo(
    () => ({
      isOpen,
      setIsOpen,
      toggle,
    }),
    [isOpen, toggle]
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "left" | "right";
}

export function Sidebar({ className, side = "left", ...props }: SidebarProps) {
  const { isOpen } = useSidebar();

  return (
    <aside
      className={cn(
        "fixed top-0 z-40 h-screen border-r border-slate-200 bg-white transition-all duration-300",
        side === "left" ? "left-0" : "right-0",
        isOpen ? "w-64" : "w-16",
        className
      )}
      {...props}
    />
  );
}

export function SidebarTrigger() {
  const { toggle } = useSidebar();

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center justify-center rounded-md p-2 text-slate-700 hover:bg-slate-100 transition-colors"
      aria-label="Toggle sidebar"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  );
}

export function SidebarContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col h-full overflow-y-auto", className)}
      {...props}
    />
  );
}

export function SidebarHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { isOpen } = useSidebar();

  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b border-slate-200 p-4",
        className
      )}
      {...props}
    >
      {isOpen && (
        <h2 className="text-lg font-semibold text-slate-900">Menu</h2>
      )}
    </div>
  );
}

export function SidebarFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-auto border-t border-slate-200 p-4", className)}
      {...props}
    />
  );
}

export function SidebarMenu({
  className,
  ...props
}: React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul className={cn("flex flex-col gap-1 p-2", className)} {...props} />
  );
}

export function SidebarMenuItem({
  className,
  ...props
}: React.HTMLAttributes<HTMLLIElement>) {
  return <li className={cn("", className)} {...props} />
}

interface SidebarMenuButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  isActive?: boolean;
}

export function SidebarMenuButton({
  className,
  icon,
  isActive = false,
  children,
  ...props
}: SidebarMenuButtonProps) {
  const { isOpen } = useSidebar();

  return (
    <button
      className={cn(
        "flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-slate-100",
        isActive && "bg-slate-100 text-slate-900",
        !isActive && "text-slate-700",
        className
      )}
      {...props}
    >
      {icon && (
        <span className={cn("flex-shrink-0", !isOpen && "mx-auto")}>
          {icon}
        </span>
      )}
      {isOpen && <span className="truncate">{children}</span>}
    </button>
  );
}

