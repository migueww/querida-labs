"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { refetchUser } = useAuth();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const redirectPath = searchParams?.get("from") || "/consolidador-xlsx";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Por favor, preencha o e-mail e a senha.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: trimmedEmail, password }),
        credentials: "include",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = data?.message || "Credenciais inválidas. Verifique seu e-mail e senha.";
        setError(errorMsg);
        toast({
          title: "Falha na autenticação",
          description: errorMsg,
          type: "error",
        });
        setIsSubmitting(false);
        return;
      }

      toast({
        title: "Login bem-sucedido!",
        description: `Bem-vinda(o) de volta, ${data.user?.name || "Ana Clara"}!`,
        type: "success",
      });

      await refetchUser();
      router.push(redirectPath);
      router.refresh();
    } catch (err) {
      console.error("Login request error:", err);
      const msg = "Ocorreu um erro ao conectar com o servidor. Tente novamente.";
      setError(msg);
      toast({
        title: "Erro de Conexão",
        description: msg,
        type: "error",
      });
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-zinc-900/60 backdrop-blur-xl shadow-xl transition-all duration-300">
      <CardHeader className="space-y-2 text-center pb-2">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-extrabold text-xl shadow-md mb-2">
          QL
        </div>
        <CardTitle className="text-2xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
          Querida Labs
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-zinc-400">
          Painel central de ferramentas internas
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" required className="text-slate-700 dark:text-zinc-300">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="ana.clara@coneqt.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
              error={!!error}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" required className="text-slate-700 dark:text-zinc-300">
                Senha
              </Label>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
                error={!!error}
                className="h-11 pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2 animate-fade-in-up">
              <svg
                className="w-4 h-4 text-red-600 shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            isLoading={isSubmitting}
            className="w-full mt-2 font-semibold h-11 text-base shadow-sm"
          >
            {isSubmitting ? "Entrando..." : "Entrar no sistema"}
          </Button>

          <div className="pt-4 border-t border-slate-100 dark:border-white/10 text-center text-xs text-slate-500 dark:text-zinc-500">
            Ambiente restrito e protegido — Querida Labs &copy; {new Date().getFullYear()}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
