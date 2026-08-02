"use client";

import { useEffect, useState, useRef } from "react";
import {
  Search,
  Plus,
  FileSpreadsheet,
  Upload,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  Filter,
  CheckSquare,
  Square,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MateriaPrimaDTO, PaginatedResult } from "@/types/revalidacao";

export function MateriaPrimaTable() {
  const [data, setData] = useState<PaginatedResult<MateriaPrimaDTO> | null>(null);
  const [loading, setLoading] = useState(true);

  // URL and search inputs
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [classificacaoFilter, setClassificacaoFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isHydrated, setIsHydrated] = useState(false);

  // Selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MateriaPrimaDTO | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isClearAllOpen, setIsClearAllOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Form states
  const [formCodigo, setFormCodigo] = useState("");
  const [formNome, setFormNome] = useState("");
  const [formDistribuidor, setFormDistribuidor] = useState("");
  const [clearPassword, setClearPassword] = useState("");

  // Feedback messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [clearBaseError, setClearBaseError] = useState<string | null>(null);
  const [clearBaseAttempts, setClearBaseAttempts] = useState<number | null>(null);
  const [lockTimeRemaining, setLockTimeRemaining] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse query params on load (SSR safe hydration)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlSearch = params.get("search") || "";
      const urlPage = parseInt(params.get("page") || "1", 10);
      const urlPageSize = parseInt(params.get("pageSize") || "10", 10);
      const urlClass = params.get("classificacao") || "ALL";

      setSearch(urlSearch);
      setSearchInput(urlSearch);
      setPage(urlPage);
      setPageSize(urlPageSize);
      setClassificacaoFilter(urlClass);
      setIsHydrated(true);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    if (!isHydrated) return;
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(1); // Reset page on new search
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput, isHydrated]);

  // Synchronize URL and fetch data
  useEffect(() => {
    if (!isHydrated) return;

    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set("search", search);
    urlParams.set("page", String(page));
    urlParams.set("pageSize", String(pageSize));
    urlParams.set("classificacao", classificacaoFilter);
    window.history.pushState(null, "", "?" + urlParams.toString());

    fetchData(page, search, classificacaoFilter, pageSize);
  }, [page, search, classificacaoFilter, pageSize, isHydrated]);

  const fetchData = async (p = page, q = search, c = classificacaoFilter, size = pageSize) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(p),
        pageSize: String(size),
        search: q,
        classificacao: c,
      });
      const res = await fetch(`/api/revalidacao-cv/materia-prima?${query.toString()}`);
      if (!res.ok) throw new Error("Falha ao carregar Matérias-Primas.");
      const json = await res.json();
      setData(json);
      // Clear selections that are no longer present in dataset
      setSelectedIds((prev) => {
        const next = new Set<string>();
        json.data.forEach((item: MateriaPrimaDTO) => {
          if (prev.has(item.id)) next.add(item.id);
        });
        return next;
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Erro de conexão ao buscar Matérias-Primas.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormCodigo("");
    setFormNome("");
    setFormDistribuidor("");
    setErrorMsg(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (item: MateriaPrimaDTO) => {
    setEditingItem(item);
    setFormCodigo(item.codigoProduto);
    setFormNome(item.nomeProduto);
    setFormDistribuidor(item.distribuidor);
    setErrorMsg(null);
  };

  const handleSaveItem = async () => {
    setErrorMsg(null);
    if (!formCodigo.trim() || !formNome.trim()) {
      setErrorMsg("Código e Nome do produto são obrigatórios.");
      return;
    }

    try {
      if (editingItem) {
        // Edit
        const res = await fetch(`/api/revalidacao-cv/materia-prima/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            codigoProduto: formCodigo,
            nomeProduto: formNome,
            distribuidor: formDistribuidor,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Erro ao editar Matéria-Prima.");
        setSuccessMsg("Matéria-Prima atualizada com sucesso!");
        setEditingItem(null);
      } else {
        // Create
        const res = await fetch("/api/revalidacao-cv/materia-prima", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            codigoProduto: formCodigo,
            nomeProduto: formNome,
            distribuidor: formDistribuidor,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Erro ao cadastrar Matéria-Prima.");
        setSuccessMsg("Matéria-Prima cadastrada com sucesso!");
        setIsCreateOpen(false);
      }
      fetchData(page, search, classificacaoFilter, pageSize);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/revalidacao-cv/materia-prima/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Erro ao excluir Matéria-Prima.");
      setSuccessMsg("Matéria-Prima excluída com sucesso.");
      setDeletingId(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      fetchData(page, search, classificacaoFilter, pageSize);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleBulkDelete = async () => {
    try {
      const res = await fetch("/api/revalidacao-cv/materia-prima/delete-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Erro ao excluir itens.");
      setSuccessMsg(json.message);
      setSelectedIds(new Set());
      setIsBulkDeleteOpen(false);
      fetchData(page, search, classificacaoFilter, pageSize);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleClearAllBase = async () => {
    setClearBaseError(null);
    if (!clearPassword.trim()) {
      setClearBaseError("Digite sua senha de login.");
      return;
    }

    try {
      const res = await fetch("/api/revalidacao-cv/materia-prima/clear-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: clearPassword }),
      });
      const json = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setLockTimeRemaining(json.lockTimeRemainingMs || 15 * 60 * 1000);
          throw new Error(json.message);
        }
        if (json.remainingAttempts !== undefined) {
          setClearBaseAttempts(json.remainingAttempts);
        }
        throw new Error(json.message || "Erro ao apagar a base.");
      }

      setSuccessMsg(json.message);
      setIsClearAllOpen(false);
      setClearPassword("");
      setSelectedIds(new Set());
      fetchData(1, "", "ALL", pageSize);
    } catch (err: any) {
      setClearBaseError(err.message);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch("/api/revalidacao-cv/template");
      if (!res.ok) throw new Error("Erro ao baixar modelo.");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Modelo_Materias_Primas.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleExportFiltered = async () => {
    try {
      const query = new URLSearchParams({
        search,
        classificacao: classificacaoFilter,
      });
      const res = await fetch(`/api/revalidacao-cv/materia-prima/export?${query.toString()}`);
      if (!res.ok) throw new Error("Erro ao exportar planilha.");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Materias_Primas_Filtradas.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/revalidacao-cv/import-mp", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Erro ao importar planilha.");

      setSuccessMsg(json.message);
      fetchData(1, "", classificacaoFilter, pageSize);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Checkbox helpers
  const isAllSelected = data && data.data.length > 0 && data.data.every((item) => selectedIds.has(item.id));

  const toggleSelectAll = () => {
    if (!data) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isAllSelected) {
        // Deselect all visible on this page
        data.data.forEach((item) => next.delete(item.id));
      } else {
        // Select all visible on this page
        data.data.forEach((item) => next.add(item.id));
      }
      return next;
    });
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Alert Messages */}
      {errorMsg && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300 text-sm animate-in fade-in-50 duration-150">
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
        <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-sm animate-in fade-in-50 duration-150">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Card */}
      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Base de Matérias-Primas
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-zinc-400">
              Cadastre, edite e pesquise produtos ou importe/exporte planilhas oficiais de Matérias-Primas.
            </CardDescription>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="gap-1.5 text-slate-700 dark:text-zinc-200"
            >
              <Download className="h-4 w-4 text-slate-500" />
              Modelo MP
            </Button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx, .xls"
              className="hidden"
            />

            <Button
              variant="outline"
              size="sm"
              disabled={isImporting}
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5 text-slate-700 dark:text-zinc-200 border-slate-300 dark:border-zinc-700"
            >
              <Upload className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              {isImporting ? "Importando..." : "Importar Planilha"}
            </Button>

            <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 font-medium">
              <Plus className="h-4 w-4" />
              Cadastrar MP
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setClearPassword("");
                setClearBaseError(null);
                setClearBaseAttempts(null);
                setLockTimeRemaining(null);
                setIsClearAllOpen(true);
              }}
              className="gap-1.5 font-medium border-red-200 hover:bg-red-50 hover:text-red-700 text-red-600 dark:border-red-950/40 dark:hover:bg-red-950/20"
            >
              <Trash2 className="h-4 w-4" />
              Excluir Base
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Pesquisar por Código, Nome ou Distribuidor (tempo real)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400 shrink-0" />
              <select
                value={classificacaoFilter}
                onChange={(e) => {
                  setClassificacaoFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-md text-xs font-medium bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 focus:outline-none"
              >
                <option value="ALL">Todas as Classificações</option>
                <option value="Regular">Regular (Padrão)</option>
                <option value="Amostra">Amostra (Código 85...)</option>
              </select>
            </div>
          </div>

          {/* Bulk Selection Actions Bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-950/50 animate-in slide-in-from-top-2 duration-200">
              <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                {selectedIds.size} {selectedIds.size === 1 ? "produto selecionado" : "produtos selecionados"}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedIds(new Set())}
                  className="h-8 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                >
                  Limpar Seleção
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsBulkDeleteOpen(true)}
                  className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
                >
                  Excluir Selecionados
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 overflow-x-auto bg-white dark:bg-zinc-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <button
                      onClick={toggleSelectAll}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                      title="Selecionar todos da página"
                    >
                      {isAllSelected ? (
                        <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Nome do Produto</th>
                  <th className="py-3 px-4">Distribuidor</th>
                  <th className="py-3 px-4">Classificação</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      <span className="inline-block animate-spin mr-2">⏳</span> Carregando Matérias-Primas...
                    </td>
                  </tr>
                ) : !data || data.data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Nenhuma Matéria-Prima encontrada.
                    </td>
                  </tr>
                ) : (
                  data.data.map((item) => {
                    const isSelected = selectedIds.has(item.id);
                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 ${isSelected ? "bg-indigo-50/20 dark:bg-indigo-950/10" : ""
                          }`}
                      >
                        <td className="py-3 px-4">
                          <button
                            onClick={() => toggleSelectItem(item.id)}
                            className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-zinc-100">
                          {item.codigoProduto}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700 dark:text-zinc-300">
                          {item.nomeProduto}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-zinc-400">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 font-semibold text-[11px]">
                            {item.distribuidor}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {item.classificacao === "Amostra" ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold text-[10px] border border-amber-200 dark:border-amber-900/40">
                              🧪 Amostra
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-medium text-[10px]">
                              Regular
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(item)}
                            className="h-7 w-7 p-0 text-slate-600 dark:text-zinc-400 hover:text-indigo-600"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingId(item.id)}
                            className="h-7 w-7 p-0 text-slate-600 dark:text-zinc-400 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {data && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-slate-500 dark:text-zinc-400">
              <div className="flex items-center gap-4">
                <span>
                  Mostrando página <strong>{data.page}</strong> de <strong>{data.totalPages}</strong> ({data.total} itens)
                </span>

                {/* Page Size Select */}
                <div className="flex items-center gap-1.5">
                  <span>Itens por página:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(parseInt(e.target.value, 10));
                      setPage(1);
                    }}
                    className="px-2 py-1 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-medium text-slate-700 dark:text-zinc-300"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {data.totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="h-8 px-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.totalPages}
                      onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                      className="h-8 px-2"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportFiltered}
                  className="h-8 gap-1.5 text-xs text-slate-700 dark:text-zinc-200 border-slate-300 dark:border-zinc-700 font-medium"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Exportar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Cadastro/Edição */}
      {(isCreateOpen || editingItem) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-base">
                {editingItem ? "Editar Matéria-Prima" : "Cadastrar Matéria-Prima"}
              </h3>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingItem(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Código do Produto *
                </label>
                <Input
                  value={formCodigo}
                  onChange={(e) => setFormCodigo(e.target.value)}
                  placeholder="Ex: 4009385 ou 8515518"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Nome do Produto *
                </label>
                <Input
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: POLIROL TS TBN200KG"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Distribuidor (Opcional)
                </label>
                <Input
                  value={formDistribuidor}
                  onChange={(e) => setFormDistribuidor(e.target.value)}
                  placeholder="Ex: ECKART (Deixe em branco para 'NÃO ATRIBUIDO')"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingItem(null);
                }}
              >
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSaveItem}>
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirm Exclusão Individual */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-base">Confirmar Exclusão</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Tem certeza que deseja remover esta Matéria-Prima da base? Esta ação não pode ser desfeita.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeletingId(null)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-red-600 hover:bg-red-700 text-white border-none"
                onClick={() => handleDeleteItem(deletingId)}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirm Exclusão em Lote */}
      {isBulkDeleteOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-base">Excluir em Lote</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Tem certeza que deseja remover as <strong>{selectedIds.size}</strong> matérias-primas selecionadas? Esta ação é definitiva e apagará todos esses registros.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsBulkDeleteOpen(false)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-red-600 hover:bg-red-700 text-white border-none"
                onClick={handleBulkDelete}
              >
                Excluir Selecionados
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Excluir Toda a Base com Senha e Rate Limit */}
      {isClearAllOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-red-600 dark:text-red-400 text-base flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Excluir Toda a Base de Dados
              </h3>
              <button
                onClick={() => setIsClearAllOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              <strong>AVISO:</strong> Esta ação apagará permanentemente todos os registros de matérias-primas cadastrados. Para confirmar esta ação irreversível, insira sua senha de acesso.
            </p>

            {clearBaseError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 text-red-800 dark:text-red-300 text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <span>{clearBaseError}</span>
              </div>
            )}

            {clearBaseAttempts !== null && clearBaseAttempts > 0 && (
              <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                Você tem mais {clearBaseAttempts} tentativa(s) antes do bloqueio de 15 minutos.
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                Senha de Acesso
              </label>
              <Input
                type="password"
                value={clearPassword}
                onChange={(e) => setClearPassword(e.target.value)}
                placeholder="Digite sua senha de login"
                className="bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsClearAllOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleClearAllBase}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                Confirmar Limpeza Total
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
