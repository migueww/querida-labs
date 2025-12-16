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

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setError("Ocorreu um erro ao tentar fazer login.");
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Login</h1>
        <p className="text-sm text-slate-600">
          Insira suas credenciais para entrar no sistema
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-700 font-medium">
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
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-slate-700 font-medium">
              Senha
            </Label>
            <Link
              href="#"
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
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
            className="h-11"
          />
        </div>

        {error ? (
          <div className="p-3 rounded-md bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : null}

        <Button
          type="submit"
          className="w-full h-11 text-base font-medium"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Entrando..." : "Login"}
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate-500">ou</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-11 text-base font-medium border-slate-300 hover:bg-slate-50"
          onClick={() => {
            // Placeholder para login com Google
            setError("Login com Google ainda não implementado.");
          }}
        >
          Login com o Google
        </Button>

        <p className="text-center text-sm text-slate-600 mt-6">
          Não tem uma conta?{" "}
          <Link
            href="#"
            className="font-medium text-slate-900 hover:underline"
          >
            Crie uma!
          </Link>
        </p>
      </form>
    </Card>
  );
}


