import React from "react";
import { LoginForm } from "@/components/login-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-12">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-slate-200/30 to-transparent blur-3xl animate-float" />
        <div className="absolute -right-1/4 -bottom-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-slate-300/20 to-transparent blur-3xl animate-float-delayed" />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        <React.Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
          <LoginForm />
        </React.Suspense>
      </div>
    </div>
  );
}
