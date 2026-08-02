"use client";

import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { MateriaPrimaTable } from "@/components/modules/revalidacao/materia-prima-table";
import { RevalidacaoGenerator } from "@/components/modules/revalidacao/revalidacao-generator";
import { FileSpreadsheet, RefreshCw, Database } from "lucide-react";

export default function RevalidacaoCvPage() {
  const [activeTab, setActiveTab] = useState<"base" | "gerar">("base");

  return (
    <AppLayout>
      <div className="w-full space-y-6">
        {/* Banner Header */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl">
          <div className="max-w-3xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs font-semibold uppercase tracking-wider text-indigo-200 backdrop-blur-xs">
                Módulo Querida Labs
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <RefreshCw className="h-8 w-8 text-indigo-400" />
              Planilha de Revalidação - CV
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Gerencie a base de Matérias-Primas e cruze com a planilha de Produtos Bloqueados para gerar automaticamente o relatório de revalidação com abas <strong>Geral</strong> e <strong>Vendas</strong>.
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2">
          <button
            onClick={() => setActiveTab("base")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === "base"
                ? "bg-slate-900 dark:bg-white text-white dark:text-zinc-950 shadow-sm"
                : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900"
              }`}
          >
            <Database className="h-4 w-4" />
            Base de Matérias-Primas
          </button>

          <button
            onClick={() => setActiveTab("gerar")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === "gerar"
                ? "bg-slate-900 dark:bg-white text-white dark:text-zinc-950 shadow-sm"
                : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900"
              }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Gerar Planilha de Revalidação
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "gerar" ? <RevalidacaoGenerator /> : <MateriaPrimaTable />}
      </div>
    </AppLayout>
  );
}
