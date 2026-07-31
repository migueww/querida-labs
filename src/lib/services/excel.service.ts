import * as XLSX from "xlsx";
import { ConsolidationResult, ExcelRowData } from "@/types/excel";

export class ExcelService {
  /**
   * Parse numerical quantity with 8 decimal places precision.
   */
  private static parseQuantity(value: unknown): number {
    if (typeof value === "number") {
      return parseFloat(value.toFixed(8));
    }
    const str = String(value || "0")
      .trim()
      .replace(/[^\d.,-]/g, "")
      .replace(",", ".");
    const num = parseFloat(str) || 0;
    return parseFloat(num.toFixed(8));
  }

  /**
   * Precise floating-point addition to 8 decimal places.
   */
  private static addQuantities(a: number, b: number): number {
    const result = a + b;
    return parseFloat(result.toFixed(8));
  }

  /**
   * Process multiple Excel files and generate a single consolidated XLSX buffer.
   */
  public static async consolidateFiles(files: File[]): Promise<ConsolidationResult> {
    if (!files || files.length === 0) {
      throw new Error("Nenhum arquivo foi enviado.");
    }

    let headerRow: (string | number | boolean | null | undefined)[] = [];
    const allRows: (string | number | boolean | null | undefined)[][] = [];

    let processedCount = 0;

    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) continue;

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
        }) as (string | number | boolean | null | undefined)[][];

        if (jsonData.length === 0) continue;

        // Capture header row from first non-empty file
        if (headerRow.length === 0 && jsonData.length > 0) {
          headerRow = jsonData[0];
        }

        // Collect data rows
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row.some((cell) => cell !== "" && cell !== null && cell !== undefined)) {
            allRows.push(row);
          }
        }
        processedCount++;
      } catch (error) {
        console.error(`[ExcelService] Error parsing file ${file.name}:`, error);
      }
    }

    if (headerRow.length === 0 || allRows.length === 0) {
      throw new Error("Nenhum dado válido foi encontrado nos arquivos enviados.");
    }

    // Detect column indexes for compound name and quantity
    const compostoIndex = headerRow.findIndex(
      (h) =>
        typeof h === "string" &&
        (h.toLowerCase().includes("composto") ||
          h.toLowerCase().includes("nome") ||
          h.toLowerCase().includes("produto") ||
          h.toLowerCase().includes("item"))
    );

    const quantidadeIndex = headerRow.findIndex(
      (h) =>
        typeof h === "string" &&
        (h.toLowerCase().includes("quantidade") ||
          h.toLowerCase().includes("qtd") ||
          h.toLowerCase().includes("qty") ||
          h.toLowerCase().includes("qt"))
    );

    if (compostoIndex === -1 || quantidadeIndex === -1) {
      throw new Error(
        "Não foi possível identificar as colunas de composto e quantidade. Verifique os cabeçalhos das planilhas."
      );
    }

    // Aggregate entries by compound name
    const compostoMap = new Map<string, ExcelRowData>();

    for (const row of allRows) {
      const composto = String(row[compostoIndex] || "").trim();
      const quantidade = this.parseQuantity(row[quantidadeIndex]);

      if (!composto) continue;

      if (compostoMap.has(composto)) {
        const existing = compostoMap.get(composto)!;
        existing.quantidade = this.addQuantities(existing.quantidade, quantidade);
      } else {
        const newRow = [...row];
        newRow[quantidadeIndex] = quantidade;
        compostoMap.set(composto, {
          composto,
          quantidade,
          row: newRow,
        });
      }
    }

    // Sort compounds descending by quantity
    const sortedEntries = Array.from(compostoMap.values()).sort((a, b) => b.quantidade - a.quantidade);

    let totalQuantity = 0;
    const consolidatedRows = sortedEntries.map((item) => {
      totalQuantity = this.addQuantities(totalQuantity, item.quantidade);
      const row = [...item.row];
      row[quantidadeIndex] = item.quantidade;
      return row;
    });

    const finalSheetData = [headerRow, ...consolidatedRows];

    // Construct new workbook
    const newWorkbook = XLSX.utils.book_new();
    const newWorksheet = XLSX.utils.aoa_to_sheet(finalSheetData);

    // Format quantity column cells with numeric precision format
    const range = XLSX.utils.decode_range(newWorksheet["!ref"] || "A1");
    for (let r = 1; r <= range.e.r; r++) {
      const cellAddress = XLSX.utils.encode_cell({ r, c: quantidadeIndex });
      if (newWorksheet[cellAddress]) {
        const cell = newWorksheet[cellAddress];
        if (typeof cell.v === "number") {
          cell.v = parseFloat(cell.v.toFixed(8));
          cell.z = "#,##0.########";
        }
      }
    }

    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Consolidado");

    const excelBuffer = XLSX.write(newWorkbook, {
      type: "buffer",
      bookType: "xlsx",
    }) as Uint8Array;

    const dateStr = new Date().toISOString().split("T")[0];

    return {
      headerRow,
      consolidatedRows,
      totalCompounds: sortedEntries.length,
      totalQuantity,
      processedFilesCount: processedCount,
      fileName: `consolidado_${dateStr}.xlsx`,
      excelBuffer,
    };
  }
}
