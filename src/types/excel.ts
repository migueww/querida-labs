export interface ExcelRowData {
  composto: string;
  quantidade: number;
  row: (string | number | boolean | null | undefined)[];
}

export interface ConsolidationResult {
  headerRow: (string | number | boolean | null | undefined)[];
  consolidatedRows: (string | number | boolean | null | undefined)[][];
  totalCompounds: number;
  totalQuantity: number;
  processedFilesCount: number;
  fileName: string;
  excelBuffer: Uint8Array;
}
