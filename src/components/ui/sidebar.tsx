"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SidebarContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggle: () => void;
  isMounted: boolean;
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
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem("sidebar:isOpen");
    if (saved !== null) {
      setIsOpen(saved === "true");
    }
    setIsMounted(true);
  }, []);

  const toggle = React.useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar:isOpen", String(next));
      return next;
    });
  }, []);

  const value = React.useMemo(
    () => ({
      isOpen,
      setIsOpen,
      toggle,
      isMounted,
    }),
    [isOpen, toggle, isMounted]
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "left" | "right";
}

export function Sidebar({ className, side = "left", ...props }: SidebarProps) {
  const { isOpen, isMounted } = useSidebar();

  return (
    <aside
      className={cn(
        "h-screen border-r border-slate-200/50 dark:border-white/5 bg-white dark:bg-[#09090b]/90 dark:backdrop-blur-xl flex flex-col shrink-0 overflow-x-hidden",
        isMounted && "transition-all duration-300",
        isOpen ? "w-64" : "w-[72px]",
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
      className="inline-flex items-center justify-center rounded-md p-2 text-slate-700 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/10 dark:hover:text-zinc-100 transition-colors cursor-pointer"
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
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M9 3v18" />
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
      className={cn("flex flex-col flex-1 overflow-y-auto", className)}
      {...props}
    />
  );
}

export function SidebarHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { isOpen } = useSidebar();

  return (
    <div
      className={cn(
        "flex flex-col p-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SidebarFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { isOpen } = useSidebar();

  return (
    <div
      className={cn(
        "mt-auto p-4 flex flex-col gap-2",
        !isOpen && "items-center",
        className
      )}
      {...props}
    >
      {children}
    </div>
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
        "flex items-center w-full rounded-lg text-[14px] font-medium transition-colors cursor-pointer",
        isOpen ? "gap-3 px-3 py-2 justify-start" : "justify-center p-2",
        "hover:bg-slate-100 dark:hover:bg-white/5 dark:hover:text-zinc-100",
        isActive && "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-zinc-50",
        !isActive && "text-slate-600 dark:text-zinc-400",
        className
      )}
      {...props}
    >
      {icon && (
        <span className={cn("flex-shrink-0 flex items-center justify-center w-5 h-5")}>
          {icon}
        </span>
      )}
      {isOpen && <span className="truncate">{children}</span>}
    </button>
  );
}

