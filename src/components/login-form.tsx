"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

const DEFAULT_EMAIL = "ana.clara@coneqt.com";
const DEFAULT_PASSWORD = "querida_2509";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const isValid =
      email === DEFAULT_EMAIL && password === DEFAULT_PASSWORD;

    if (!isValid) {
      setError("Credenciais inválidas. Verifique seu e-mail e senha.");
      setIsSubmitting(false);
      return;
    }

    // Simula um pequeno delay para feedback de loading.
    setTimeout(() => {
      setIsSubmitting(false);
      router.push("/dashboard");
    }, 500);
  }

  return (
    <Card>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">
          Login
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Use o login padrão para acessar o sistema.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Sua senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : null}

        <Button
          type="submit"
          className="mt-2 w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Entrando..." : "Entrar"}
        </Button>

        <p className="mt-3 text-center text-xs text-slate-400">
          E-mail: <span className="font-mono">{DEFAULT_EMAIL}</span>{" "}
          · Senha: <span className="font-mono">{DEFAULT_PASSWORD}</span>
        </p>
      </form>
    </Card>
  );
}


