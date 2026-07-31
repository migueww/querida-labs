"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function ExcelConsolidator() {
  const { toast } = useToast();

  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const addFiles = (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(
      (file) =>
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls") ||
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel"
    );

    if (validFiles.length < files.length) {
      toast({
        title: "Arquivos ignorados",
        description: "Apenas arquivos Excel (.xlsx ou .xls) são aceitos.",
        type: "warning",
      });
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
      setError(null);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
    }
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    setError(null);
  };

  const handleConsolidate = async () => {
    if (selectedFiles.length === 0) {
      setError("Por favor, selecione ao menos uma planilha Excel.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/consolidar", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Erro ao consolidar os arquivos Excel.");
      }

      // Download file blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const dateStr = new Date().toISOString().split("T")[0];
      link.download = `consolidado_${dateStr}.xlsx`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      const totalCompounds = response.headers.get("X-Total-Compounds");
      const totalQuantity = response.headers.get("X-Total-Quantity");

      toast({
        title: "Consolidação concluída!",
        description: totalCompounds
          ? `Consolidados ${totalCompounds} compostos (Total: ${totalQuantity}). O download começou.`
          : "O download do arquivo consolidado começou automaticamente.",
        type: "success",
      });

      setSelectedFiles([]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro inesperado ao consolidar planilhas.";
      setError(msg);
      toast({
        title: "Erro no processamento",
        description: msg,
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      <Card className="p-6 md:p-8 bg-white dark:bg-[#09090b]/80 border-slate-200/90 dark:border-white/10 shadow-sm dark:backdrop-blur-xl">
        <CardHeader className="p-0 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900 dark:text-zinc-100">
                Consolidador de Planilhas XLSX
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-zinc-400 mt-1">
                Envie múltiplos arquivos Excel para somar automaticamente as quantidades de cada composto com precisão.
              </CardDescription>
            </div>
            <div className="hidden sm:flex h-10 w-10 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-zinc-200 items-center justify-center font-bold">
              📊
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 space-y-6">
          {/* Sample template info box */}
          <div className="p-4 bg-blue-50/70 border border-blue-200/60 dark:bg-blue-900/10 dark:border-blue-500/20 rounded-xl flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1 text-xs text-blue-900 dark:text-blue-100 space-y-1">
              <p className="font-semibold text-sm">Formato padrão da planilha</p>
              <p className="text-blue-800 dark:text-blue-200/80">
                As planilhas devem conter cabeçalhos identificando a coluna do <strong>Composto</strong> e da <strong>Quantidade</strong>.
              </p>
              <a
                href="/planilha_compostos_exemplo.xlsx"
                download="planilha_compostos_exemplo.xlsx"
                className="inline-flex items-center gap-1.5 font-medium text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:underline pt-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Baixar planilha de exemplo (.xlsx)
              </a>
            </div>
          </div>

          {/* Drag & Drop file zone */}
          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-zinc-300 font-medium">Arquivos Excel (.xlsx / .xls)</Label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
                isDragOver
                  ? "border-slate-900 bg-slate-100/80 dark:border-white/50 dark:bg-zinc-900/80 scale-[1.005]"
                  : "border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-100/50 dark:border-white/10 dark:hover:border-white/30 dark:bg-zinc-900/30 dark:hover:bg-zinc-900/50"
              }`}
            >
              <input
                id="file-upload"
                type="file"
                multiple
                accept=".xlsx,.xls"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Upload de arquivos Excel"
              />
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-slate-200/80 dark:bg-white/10 text-slate-600 dark:text-zinc-400 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                    Clique para selecionar ou arraste seus arquivos aqui
                  </p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                    Suporta planilhas .XLSX e .XLS (sem limite de linhas)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Selected files list */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  Arquivos selecionados ({selectedFiles.length})
                </span>
                <Button variant="ghost" size="sm" onClick={clearAllFiles} className="text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                  Remover todos
                </Button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-white/10 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="h-7 w-7 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                        XLS
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 dark:text-zinc-100 truncate">{file.name}</p>
                        <p className="text-slate-500 dark:text-zinc-400 text-[11px]">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(idx)}
                      className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                      aria-label="Remover arquivo"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Action button */}
          <Button
            size="lg"
            isLoading={isProcessing}
            disabled={selectedFiles.length === 0}
            onClick={handleConsolidate}
            className="w-full h-12 text-base font-semibold shadow-md"
          >
            {isProcessing ? "Processando e consolidando planilhas..." : "Consolidar e Baixar Excel (.xlsx)"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
