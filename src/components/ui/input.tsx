import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-lg border bg-white dark:bg-zinc-900/50 px-3 py-2 text-sm text-slate-900 dark:text-zinc-100 shadow-2xs transition-all duration-150",
          "placeholder:text-slate-400 dark:placeholder:text-zinc-500",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-white/20 focus-visible:ring-offset-1 focus-visible:border-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-zinc-900",
          error
            ? "border-red-500 focus-visible:ring-red-500"
            : "border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/30",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
