import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={`w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl ${className ?? ""}`}
      {...props}
    />
  );
}


