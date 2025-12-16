import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={`w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-lg ${className ?? ""}`}
      {...props}
    />
  );
}


