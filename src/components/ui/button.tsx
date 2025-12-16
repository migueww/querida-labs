import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
}

export function Button({
  className,
  variant = "default",
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  const variantClasses =
    variant === "outline"
      ? "border border-slate-300 bg-white text-slate-900 shadow-sm hover:bg-slate-50"
      : "border border-transparent bg-slate-900 text-white shadow-sm hover:bg-slate-800";

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${className ?? ""}`}
      {...props}
    />
  );
}


