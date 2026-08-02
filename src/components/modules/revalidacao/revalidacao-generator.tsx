"use client";

import { useState, useRef } from "react";
import {
  FileSpreadsheet,
  Upload,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  X,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function RevalidacaoGenerator() {
  const [baseTabName, setBaseTabName] = useState("Revalidação CV");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        setErrorMsg("Por favor, selecione uma planilha Excel válida (.xlsx ou .xls).");
        return;
      }
      setSelectedFile(file);
      setErrorMsg(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        setErrorMsg("Por favor, selecione uma planilha Excel válida (.xlsx ou .xls).");
        return;
      }
      setSelectedFile(file);
      setErrorMsg(null);
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      setErrorMsg("Selecione a planilha de Produtos Bloqueados antes de gerar.");
      return;
    }

    if (!baseTabName.trim()) {
      setErrorMsg("Informe o nome a ser utilizado nas abas da planilha final.");
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("baseTabName", baseTabName.trim());

    try {
      const res = await fetch("/api/revalidacao-cv/gerar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || "Falha ao gerar a planilha de revalidação.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = baseTabName.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
      a.download = `Planilha_Revalidacao_${safeName}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setSuccessMsg("Planilha de revalidação gerada e baixada com sucesso!");
    } catch (err: any) {
      setErrorMsg(err.message || "Ocorreu um erro ao processar o cruzamento.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Messages */}
      {errorMsg && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300 text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <Card className="shadow-sm border-slate-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Gerar Planilha de Revalidação
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-zinc-400">
            Importe a planilha de Produtos Bloqueados para cruzar com a base de Matérias-Primas do banco de dados e gerar o arquivo Excel final com as abas Geral e Vendas.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Tab Name Config */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 space-y-2">
            <label className="text-xs font-bold text-slate-800 dark:text-zinc-200">
              Nome Base das Abas *
            </label>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              As abas geradas seguirão o padrão: <code>{baseTabName || "Nome"}</code> (Geral) e <code>{baseTabName || "Nome"} - VENDAS</code> (Vendas).
            </p>
            <Input
              value={baseTabName}
              onChange={(e) => setBaseTabName(e.target.value)}
              placeholder="Ex: Revalidação CV - Agosto 2026"
              className="bg-white dark:bg-zinc-950"
            />
          </div>

          {/* Drag & Drop File Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              selectedFile
                ? "border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10"
                : "border-slate-300 dark:border-zinc-700 hover:border-indigo-400 bg-slate-50/50 dark:bg-zinc-900/40"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls"
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex flex-col items-center gap-2 text-slate-800 dark:text-zinc-200">
                <FileCheck className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                <span className="font-semibold text-sm">{selectedFile.name}</span>
                <span className="text-xs text-slate-500 dark:text-zinc-400">
                  ({(selectedFile.size / 1024).toFixed(1)} KB) - Clique para alterar o arquivo
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-zinc-400">
                <Upload className="h-10 w-10 text-slate-400 dark:text-zinc-500 mb-1" />
                <span className="font-semibold text-sm text-slate-700 dark:text-zinc-200">
                  Arraste e solte a planilha de Produtos Bloqueados aqui
                </span>
                <span className="text-xs">ou clique para selecionar um arquivo (.xlsx / .xls)</span>
              </div>
            )}
          </div>

          {/* Preview of Output structure */}
          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 p-4 bg-slate-50/50 dark:bg-zinc-900/40 text-xs space-y-2 text-slate-600 dark:text-zinc-400">
            <span className="font-semibold text-slate-800 dark:text-zinc-200">📋 Estrutura da Planilha Gerada:</span>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Aba 1 (<code>{baseTabName || "..."}</code>):</strong> Contém todos os produtos coincidentes no cruzamento pelo Código do Produto.
              </li>
              <li>
                <strong>Aba 2 (<code>{baseTabName || "..."} - VENDAS</code>):</strong> Exclui automaticamente todos os produtos classificados como <strong>Amostra</strong> (códigos iniciando em 85).
              </li>
              <li>
                12 colunas formatadas: Código, Nome, Lote, Distribuída, Saldo de Estoque, Status, Fabricação, Validade, Detalhes, Observações, Risco (em branco) e Estratégia Sugerida (em branco).
              </li>
            </ul>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedFile}
            className="w-full h-11 text-sm font-semibold gap-2 shadow-md bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isGenerating ? (
              <>
                <span className="animate-spin text-base">⏳</span>
                Cruzando dados e gerando planilha Excel...
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-4 w-4" />
                Gerar Planilha de Revalidação (.xlsx)
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
