"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  FileSpreadsheet,
  Upload,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  X,
  FileCheck,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function RevalidacaoGenerator() {
  const [baseTabName, setBaseTabName] = useState("Revalidação CV");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [excludeLiberados, setExcludeLiberados] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processUploadedFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheets = workbook.SheetNames || [];
        setAvailableSheets(sheets);

        // Pre-select sheets containing "bloqueado" or "geral"
        const initialSelected = sheets.filter((name) => {
          const norm = name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "")
            .trim();
          return norm.includes("bloqueado") || norm.includes("geral");
        });

        // Fallback to first sheet if no sheets match the keywords
        if (initialSelected.length === 0 && sheets.length > 0) {
          initialSelected.push(sheets[0]);
        }

        setSelectedSheets(initialSelected);
        setIsModalOpen(true);
      } catch (err) {
        setErrorMsg("Erro ao ler as abas da planilha. Verifique se o arquivo não está corrompido.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        setErrorMsg("Por favor, selecione uma planilha Excel válida (.xlsx ou .xls).");
        return;
      }
      setSelectedFile(file);
      setErrorMsg(null);
      processUploadedFile(file);
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
      processUploadedFile(file);
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

    if (selectedSheets.length === 0) {
      setErrorMsg("Você deve selecionar pelo menos uma aba para análise nas configurações.");
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("baseTabName", baseTabName.trim());
    formData.append("excludeLiberados", String(excludeLiberados));
    selectedSheets.forEach((sheet) => {
      formData.append("sheets", sheet);
    });

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
        <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300 text-sm animate-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-sm animate-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700 cursor-pointer">
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
            onClick={() => {
              if (!selectedFile) fileInputRef.current?.click();
            }}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
              selectedFile
                ? "border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/5"
                : "border-slate-300 dark:border-zinc-700 hover:border-indigo-400 bg-slate-50/50 dark:bg-zinc-900/40 cursor-pointer"
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
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
                
                <div className="flex items-center gap-3 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-9 gap-1.5 border-indigo-200 dark:border-indigo-950/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsModalOpen(true);
                    }}
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Configurar Abas & Filtros
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs h-9 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setSelectedSheets([]);
                      setAvailableSheets([]);
                    }}
                  >
                    Trocar arquivo
                  </Button>
                </div>
                
                <div className="text-[11px] text-slate-500 dark:text-zinc-500 mt-2">
                  Abas selecionadas: <span className="font-medium text-slate-700 dark:text-zinc-300">{selectedSheets.join(", ") || "Nenhuma"}</span>
                  {excludeLiberados && <span className="text-indigo-600 dark:text-indigo-400 ml-2 font-medium">• Ignorando "Liberados"</span>}
                </div>
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
            disabled={isGenerating || !selectedFile || selectedSheets.length === 0}
            className="w-full h-11 text-sm font-semibold gap-2 shadow-md bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
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

      {/* Modal de Configuração de Abas (Checboxes) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl p-6 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Settings className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  Configurações do Arquivo
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Selecione as abas para analisar e opções de filtros adicionais.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-zinc-200 p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 my-5">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Abas para Análise (Multi-seleção):
                </span>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-slate-100 dark:border-zinc-800 rounded-xl p-2 bg-slate-50/50 dark:bg-zinc-950/50">
                  {availableSheets.length === 0 ? (
                    <div className="text-xs text-slate-400 text-center py-4">Nenhuma aba disponível</div>
                  ) : (
                    availableSheets.map((sheet) => {
                      const isChecked = selectedSheets.includes(sheet);
                      return (
                        <label
                          key={sheet}
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? "border-indigo-400 bg-indigo-50/15 dark:bg-indigo-950/10 text-indigo-900 dark:text-indigo-300 font-medium"
                              : "border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/40 text-slate-600 dark:text-zinc-400"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedSheets(selectedSheets.filter((s) => s !== sheet));
                              } else {
                                setSelectedSheets([...selectedSheets, sheet]);
                              }
                            }}
                            className="h-3.5 w-3.5 rounded border-slate-350 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className="truncate">{sheet}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Status Filter Toggle */}
              <div className="p-3.5 rounded-xl bg-indigo-50/10 dark:bg-indigo-950/5 border border-indigo-100/50 dark:border-indigo-950/30">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={excludeLiberados}
                    onChange={(e) => setExcludeLiberados(e.target.checked)}
                    className="h-3.5 w-3.5 mt-0.5 rounded border-slate-350 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                      Ignorar produtos com status 'Liberado'
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                      Se ativado, produtos que possuírem status igual a "Liberado" nas abas selecionadas não serão inclusos no arquivo gerado.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2.5 justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="h-9 text-xs rounded-lg px-4"
              >
                Cancelar
              </Button>
              <Button
                disabled={selectedSheets.length === 0}
                onClick={() => {
                  if (selectedSheets.length === 0) return;
                  setIsModalOpen(false);
                }}
                className="h-9 text-xs rounded-lg px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium cursor-pointer"
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
