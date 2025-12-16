import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
  size?: "sm" | "default" | "lg";
}

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  const sizeClasses = {
    sm: "h-8 px-3 text-xs",
    default: "h-10 px-4 py-2 text-sm",
    lg: "h-12 px-6 text-base",
  };

  const variantClasses =
    variant === "outline"
      ? "border border-slate-300 bg-white text-slate-900 shadow-sm hover:bg-slate-50"
      : "border border-transparent bg-slate-900 text-white shadow-sm hover:bg-slate-800";

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses} ${className ?? ""}`}
      {...props}
    />
  );
}


