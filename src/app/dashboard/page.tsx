"use client";

import { AppLayout } from "@/components/app-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="w-full space-y-6">
        {/* Welcome Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-xl">
          <div className="max-w-2xl space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs font-semibold uppercase tracking-wider text-slate-200 backdrop-blur-xs">
              Querida Labs Central
            </span>
            <h1 className="text-3xl font-bold tracking-tight">
              Bem-vinda, {user?.name || "Ana Clara"}! 👋
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Acesse abaixo as ferramentas internas personalizadas para agilizar suas atividades diárias.
            </p>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tool Card 1: Consolidador XLSX */}
          <Card className="hover:border-slate-300 transition-all shadow-sm hover:shadow-md flex flex-col justify-between">
            <CardHeader>
              <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-lg font-bold mb-3 shadow-xs">
                📊
              </div>
              <CardTitle className="text-lg font-bold">Consolidador XLSX</CardTitle>
              <CardDescription>
                Combine e processe múltiplas planilhas Excel em um único arquivo com soma de compostos e precisão decimal de até 8 casas.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Link href="/consolidador-xlsx">
                <Button className="w-full gap-2 font-medium">
                  Acessar Consolidador
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Tool Card 2: Planilha de Revalidação - CV */}
          <Card className="hover:border-slate-300 transition-all shadow-sm hover:shadow-md flex flex-col justify-between">
            <CardHeader>
              <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg font-bold mb-3 shadow-xs">
                🔄
              </div>
              <CardTitle className="text-lg font-bold">Planilha de Revalidação - CV</CardTitle>
              <CardDescription>
                Gerencie Matérias-Primas e cruze com Produtos Bloqueados para gerar a planilha final em abas Geral e Vendas.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Link href="/revalidacao-cv">
                <Button className="w-full gap-2 font-medium bg-indigo-600 hover:bg-indigo-700 text-white">
                  Acessar Revalidação
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Placeholder for future tools */}
          <Card className="border-dashed border-slate-300 bg-slate-50/50 flex flex-col justify-center items-center p-8 text-center">
            <div className="h-10 w-10 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center text-lg mb-3">
              ⚡
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Novas Ferramentas</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Módulos em desenvolvimento para expansão futura do Querida Labs.
            </p>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
