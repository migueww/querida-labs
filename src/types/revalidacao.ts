export type ProductClassification = "Amostra" | "Regular";

export interface MateriaPrima {
  id: string;
  codigoProduto: string;
  nomeProduto: string;
  distribuidor: string;
  classificacao: ProductClassification;
  createdAt: Date;
  updatedAt: Date;
}

export interface MateriaPrimaDTO {
  id: string;
  codigoProduto: string;
  nomeProduto: string;
  distribuidor: string;
  classificacao: ProductClassification;
  createdAt: string;
  updatedAt: string;
}

export interface ProdutoBloqueadoRow {
  codigoProduto: string;
  nomeProduto: string;
  lote: string;
  saldoEstoque: number | string;
  status: string;
  dataFabricacao: string;
  dataValidade: string;
  detalhes: string;
  observacoes: string;
  distribuida: string;
  qtdPendentePedidos: number | string;
}

export interface RevalidacaoFinalRow {
  codigoProduto: string; // From Matéria-Prima
  nomeProduto: string;   // From Matéria-Prima
  lote: string;          // From Produtos Bloqueados
  distribuida: string;   // From Produtos Bloqueados
  saldoEstoque: number | string;
  status: string;
  dataFabricacao: string;
  dataValidade: string;
  detalhes: string;
  observacoes: string;
  risco: string;               // Blank
  estrategiaSugerida: string;  // Blank
  classificacao: ProductClassification;
}

export interface ImportMPResult {
  insertedCount: number;
  updatedCount: number;
  totalProcessed: number;
  duplicateErrors?: string[];
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
