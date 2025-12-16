"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(
          data?.message ||
            "Credenciais inválidas. Verifique seu e-mail e senha."
        );
        setIsSubmitting(false);
        return;
      }

      router.push("/consolidador-xlsx");
      router.refresh();
    } catch (error) {
      setError("Ocorreu um erro ao tentar fazer login.");
      setIsSubmitting(false);
    }
  }

  return (
    <Card 
      className={`w-full max-w-md border-slate-200/80 bg-white/80 backdrop-blur-sm shadow-xl transition-all duration-700 ease-out ${
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="mb-8 space-y-1">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-1 w-1 rounded-full bg-slate-400 animate-pulse" />
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Login
          </h1>
        </div>
        <p className="text-sm text-slate-600">
          Insira suas credenciais para entrar no sistema
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label 
            htmlFor="email" 
            className="text-slate-700 font-medium text-sm"
          >
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="h-11 transition-all duration-200 focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label 
              htmlFor="password" 
              className="text-slate-700 font-medium text-sm"
            >
              Senha
            </Label>
            <Link
              href="#"
              className="text-xs text-slate-500 hover:text-slate-900 transition-colors duration-200 hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Sua senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="h-11 transition-all duration-200 focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400"
          />
        </div>

        <div 
          className={`transition-all duration-300 ease-out ${
            error 
              ? "opacity-100 max-h-20 translate-y-0" 
              : "opacity-0 max-h-0 translate-y-2 overflow-hidden"
          }`}
        >
          <div className="p-3 rounded-lg bg-red-50/80 border border-red-200/50 backdrop-blur-sm">
            <p className="text-sm text-red-600 flex items-center gap-2">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </p>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
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
              Entrando...
            </span>
          ) : (
            "Login"
          )}
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200/60"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-white text-slate-400 font-medium">ou</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-11 text-base font-medium border-slate-200 hover:bg-slate-50/80 hover:border-slate-300 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          onClick={() => {
            setError("Login com Google ainda não implementado.");
          }}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Login com o Google
          </span>
        </Button>

        <p className="text-center text-xs text-slate-500 mt-6">
          Não tem uma conta?{" "}
          <Link
            href="#"
            className="font-medium text-slate-900 hover:text-slate-700 transition-colors duration-200 hover:underline"
          >
            Crie uma!
          </Link>
        </p>
      </form>
    </Card>
  );
}


