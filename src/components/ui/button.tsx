import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost";
  size?: "sm" | "default" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer";

    const variantClasses = {
      default: "bg-slate-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-slate-800 dark:hover:bg-zinc-200 shadow-sm hover:shadow-md disabled:dark:bg-white/10 disabled:dark:text-white/40 disabled:opacity-100 disabled:shadow-none",
      outline:
        "border border-slate-300 dark:border-white/10 bg-white dark:bg-transparent text-slate-800 dark:text-zinc-100 hover:bg-slate-50 dark:hover:bg-white/5 hover:border-slate-400 dark:hover:border-white/20 shadow-xs",
      secondary: "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-zinc-100 hover:bg-slate-200 dark:hover:bg-white/20",
      destructive: "bg-red-600 dark:bg-red-500/90 text-white hover:bg-red-700 dark:hover:bg-red-600 shadow-xs",
      ghost: "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/10 dark:hover:text-zinc-100",
    };

    const sizeClasses = {
      sm: "h-8 px-3 text-xs gap-1.5",
      default: "h-10 px-4 py-2 text-sm gap-2",
      lg: "h-11 px-6 text-base gap-2.5",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
