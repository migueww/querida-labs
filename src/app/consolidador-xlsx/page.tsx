"use client";

import { AppLayout } from "@/components/app-layout";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";

export default function ConsolidadorXLSXPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (files) {
      const xlsxFiles = Array.from(files).filter(
        (file) =>
          file.name.endsWith(".xlsx") || file.name.endsWith(".xls")
      );
      setSelectedFiles((prev) => [...prev, ...xlsxFiles]);
      setError(null);
    }
    // Limpa o input para permitir selecionar o mesmo arquivo novamente
    event.target.value = "";
  }

  function handleRemoveFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  }

  function handleClearAll() {
    setSelectedFiles([]);
    setError(null);
  }

  async function handleConsolidate() {
    if (selectedFiles.length === 0) {
      setError("Por favor, selecione pelo menos um arquivo.");
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
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Erro ao consolidar arquivos.");
      }

      // Faz o download do arquivo consolidado
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `consolidado_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Limpa os arquivos após sucesso
      setSelectedFiles([]);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao consolidar os arquivos."
      );
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <AppLayout>
      <div className="w-full max-w-4xl">
        <Card className="p-8">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            Consolidador XLSX
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            Ferramenta para consolidar arquivos Excel (.xlsx) em um único arquivo.
          </p>

          {/* Download exemplo */}
          <div className="mb-6 p-4 bg-blue-50/50 border border-blue-200/50 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
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
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 mb-1">
                  Não sabe o formato?
                </p>
                <p className="text-xs text-slate-600 mb-2">
                  Baixe o arquivo de exemplo para ver o formato esperado.
                </p>
                <a
                  href="/planilha_compostos_exemplo.xlsx"
                  download="planilha_compostos_exemplo.xlsx"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 hover:underline"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Baixar arquivo de exemplo
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="file-upload" className="text-slate-700 font-medium">
                Adicionar Arquivo Excel
              </Label>
              <div className="flex items-center gap-4">
                <label
                  htmlFor="file-upload"
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg
                        className="w-10 h-10 mb-3 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="mb-2 text-sm text-slate-500">
                        <span className="font-semibold">Clique para fazer upload</span> ou arraste e solte
                      </p>
                      <p className="text-xs text-slate-500">
                        XLSX ou XLS (MAX. 10MB por arquivo)
                      </p>
                    </div>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls"
                    multiple
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-700 font-medium">
                    Arquivos Selecionados ({selectedFiles.length})
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    className="text-xs"
                  >
                    Limpar Todos
                  </Button>
                </div>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <svg
                          className="w-5 h-5 text-green-600 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                        className="ml-2 flex-shrink-0"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-50/80 border border-red-200/50">
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
            )}

            {selectedFiles.length > 0 && (
              <div className="pt-4 border-t border-slate-200">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleConsolidate}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
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
                      Processando...
                    </span>
                  ) : (
                    "Consolidar Arquivos"
                  )}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

