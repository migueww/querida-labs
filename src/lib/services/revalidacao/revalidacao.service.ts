import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import {
  MateriaPrima,
  ProdutoBloqueadoRow,
  RevalidacaoFinalRow,
  ImportMPResult,
} from "@/types/revalidacao";
import { MateriaPrimaModel } from "@/lib/models/materia-prima.model";

export class RevalidacaoService {
  /**
   * Formats an Excel date serial number or date object/string to DD/MM/YYYY format.
   */
  public static formatDate(value: any): string {
    if (value === null || value === undefined || value === "") return "";
    
    // Excel date serial number
    if (typeof value === "number") {
      const dateObj = XLSX.SSF.parse_date_code(value);
      if (dateObj) {
        const day = String(dateObj.d).padStart(2, "0");
        const month = String(dateObj.m).padStart(2, "0");
        const year = dateObj.y;
        return `${day}/${month}/${year}`;
      }
    }
    
    // JS Date object
    if (value instanceof Date) {
      const day = String(value.getDate()).padStart(2, "0");
      const month = String(value.getMonth() + 1).padStart(2, "0");
      const year = value.getFullYear();
      return `${day}/${month}/${year}`;
    }

    return String(value).trim();
  }

  /**
   * Helper to normalize header key string for comparison
   */
  private static normalizeHeader(header: string): string {
    return header
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .trim();
  }

  /**
   * Parses and validates raw materials (Matérias-Primas) spreadsheet.
   * Enforces rules:
   * - Required columns: Código do Produto, Nome do Produto
   * - Optional column: Distribuidor / Distribuída
   * - Check for duplicate codes with DIFFERENT data inside the file.
   */
  public static async parseAndValidateMPSpreadsheet(
    fileBuffer: Buffer
  ): Promise<{ items: Array<{ codigoProduto: string; nomeProduto: string; distribuidor?: string }>; resultSummary: ImportMPResult }> {
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(fileBuffer, { type: "buffer" });
    } catch {
      throw new Error("O arquivo fornecido não é um Excel (.xlsx ou .xls) válido ou está corrompido.");
    }

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error("A planilha não contém nenhuma aba de dados.");
    }

    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });

    if (!rawRows || rawRows.length === 0) {
      throw new Error("A planilha de Matérias-Primas está vazia.");
    }

    // Find headers mapping
    const sampleRow = rawRows[0];
    const headerKeys = Object.keys(sampleRow);

    let codeKey = headerKeys.find((k) =>
      this.normalizeHeader(k).includes("codigodoproduto") || this.normalizeHeader(k) === "codigo"
    );
    let nameKey = headerKeys.find((k) =>
      this.normalizeHeader(k).includes("nomedoproduto") || this.normalizeHeader(k) === "produto" || this.normalizeHeader(k) === "nome"
    );
    let distribKey = headerKeys.find((k) =>
      this.normalizeHeader(k).includes("distribuidor") || this.normalizeHeader(k).includes("distribuida")
    );

    if (!codeKey || !nameKey) {
      throw new Error(
        "A estrutura da planilha é inválida. As colunas obrigatórias 'Código do Produto' e 'Nome do Produto' foram ausentes."
      );
    }

    // Validate rows and detect conflicting duplicates inside file
    const codeToDataMap = new Map<string, { nomeProduto: string; distribuidor: string; lineNumbers: number[] }>();
    const conflictingCodes = new Set<string>();

    rawRows.forEach((row, idx) => {
      const rawCode = row[codeKey!];
      const rawName = row[nameKey!];
      const rawDistrib = distribKey ? row[distribKey] : "";

      if (rawCode === undefined || rawCode === null || String(rawCode).trim() === "") {
        return; // Skip empty rows
      }

      const codigoProduto = MateriaPrimaModel.normalizeCodigo(rawCode);
      const nomeProduto = String(rawName || "").trim();
      const distribuidor = MateriaPrimaModel.normalizeDistribuidor(rawDistrib);

      if (!nomeProduto) {
        return;
      }

      const lineNumber = idx + 2; // Header is row 1

      if (codeToDataMap.has(codigoProduto)) {
        const existing = codeToDataMap.get(codigoProduto)!;
        // Check if data is different
        if (
          existing.nomeProduto.toLowerCase() !== nomeProduto.toLowerCase() ||
          existing.distribuidor.toLowerCase() !== distribuidor.toLowerCase()
        ) {
          conflictingCodes.add(codigoProduto);
        }
        existing.lineNumbers.push(lineNumber);
      } else {
        codeToDataMap.set(codigoProduto, {
          nomeProduto,
          distribuidor,
          lineNumbers: [lineNumber],
        });
      }
    });

    if (conflictingCodes.size > 0) {
      const conflictList = Array.from(conflictingCodes).join(", ");
      throw new Error(
        `Foram encontrados códigos duplicados com informações conflitantes na planilha: [ ${conflictList} ]. Por favor, corrija a planilha antes de importar.`
      );
    }

    const items = Array.from(codeToDataMap.entries()).map(([codigoProduto, data]) => ({
      codigoProduto,
      nomeProduto: data.nomeProduto,
      distribuidor: data.distribuidor,
    }));

    // Import into DB
    const importStats = await MateriaPrimaModel.upsertMany(items);

    return {
      items,
      resultSummary: {
        insertedCount: importStats.insertedCount,
        updatedCount: importStats.updatedCount,
        totalProcessed: items.length,
      },
    };
  }

  /**
   * Generates an empty Excel template for raw materials (Matérias-Primas).
   */
  public static async generateMPTemplateBuffer(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Matérias-Primas");

    sheet.columns = [
      { header: "Código do Produto", key: "codigo", width: 20 },
      { header: "Nome do Produto", key: "nome", width: 40 },
      { header: "Distribuidor", key: "distribuidor", width: 25 },
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "1E293B" }, // Slate 800
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 24;

    // Example row
    sheet.addRow({
      codigo: "4009385",
      nome: "2768 UNIPAK WB RICH FLEXO+INK TBN20KG",
      distribuidor: "ECKART",
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Parses and validates Produtos Bloqueados spreadsheet.
   */
  public static parseProdutosBloqueadosSpreadsheet(fileBuffer: Buffer): ProdutoBloqueadoRow[] {
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(fileBuffer, { type: "buffer" });
    } catch {
      throw new Error("O arquivo de Produtos Bloqueados não é um Excel válido ou está corrompido.");
    }

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error("A planilha de Produtos Bloqueados está vazia.");
    }

    // Find sheet containing data
    let targetSheetName = workbook.SheetNames.find((name) =>
      this.normalizeHeader(name).includes("bloqueado") || this.normalizeHeader(name).includes("geral")
    );
    if (!targetSheetName) {
      targetSheetName = workbook.SheetNames[0];
    }

    const sheet = workbook.Sheets[targetSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });

    if (!rawRows || rawRows.length === 0) {
      throw new Error(`A aba '${targetSheetName}' da planilha de Produtos Bloqueados está vazia.`);
    }

    // Header keys
    const sampleRow = rawRows[0];
    const headerKeys = Object.keys(sampleRow);

    const getFieldKey = (pattern: string) =>
      headerKeys.find((k) => this.normalizeHeader(k).includes(this.normalizeHeader(pattern)));

    const codeKey = getFieldKey("codigo");
    const nameKey = getFieldKey("nome");
    const loteKey = getFieldKey("lote");
    const saldoKey = getFieldKey("saldo");
    const statusKey = getFieldKey("status");
    const fabKey = getFieldKey("fabricacao");
    const valKey = getFieldKey("validade");
    const detKey = getFieldKey("detalhes");
    const obsKey = getFieldKey("observac");
    const distKey = getFieldKey("distribuida") || getFieldKey("distribuidor");
    const pendKey = getFieldKey("pendente");

    if (!codeKey) {
      throw new Error("A coluna 'Código do Produto' não foi encontrada na planilha de Produtos Bloqueados.");
    }

    const result: ProdutoBloqueadoRow[] = [];

    for (const row of rawRows) {
      const rawCode = row[codeKey];
      if (rawCode === undefined || rawCode === null || String(rawCode).trim() === "") {
        continue;
      }

      const codigoProduto = MateriaPrimaModel.normalizeCodigo(rawCode);

      result.push({
        codigoProduto,
        nomeProduto: String(row[nameKey || ""] || "").trim(),
        lote: String(row[loteKey || ""] || "").trim(),
        saldoEstoque: row[saldoKey || ""] !== "" ? row[saldoKey || ""] : 0,
        status: String(row[statusKey || ""] || "").trim(),
        dataFabricacao: this.formatDate(row[fabKey || ""]),
        dataValidade: this.formatDate(row[valKey || ""]),
        detalhes: String(row[detKey || ""] || "").trim(),
        observacoes: String(row[obsKey || ""] || "").trim(),
        distribuida: String(row[distKey || ""] || "").trim() || "NÃO ATRIBUIDO",
        qtdPendentePedidos: row[pendKey || ""] !== "" ? row[pendKey || ""] : 0,
      });
    }

    if (result.length === 0) {
      throw new Error("Nenhum produto válido foi encontrado na planilha de Produtos Bloqueados.");
    }

    return result;
  }

  /**
   * Compares Produtos Bloqueados with Matérias-Primas Map and generates ExcelJS output.
   */
  public static async generateRevalidationWorkbook(
    produtosBloqueados: ProdutoBloqueadoRow[],
    materiaPrimaMap: Map<string, MateriaPrima>,
    baseTabName: string
  ): Promise<Buffer> {
    const cleanBaseTab = baseTabName.trim() || "Revalidação CV";
    const geralTabName = cleanBaseTab;
    const vendasTabName = `${cleanBaseTab} - VENDAS`;

    // Match products against Matérias-Primas DB
    const matchedRows: RevalidacaoFinalRow[] = [];

    for (const pb of produtosBloqueados) {
      const mp = materiaPrimaMap.get(pb.codigoProduto);
      if (!mp) {
        // If product does not exist in MP base, ignore silently as per specification
        continue;
      }

      matchedRows.push({
        codigoProduto: mp.codigoProduto,
        nomeProduto: mp.nomeProduto,
        lote: pb.lote,
        distribuida: pb.distribuida || mp.distribuidor,
        saldoEstoque: pb.saldoEstoque,
        status: pb.status,
        dataFabricacao: pb.dataFabricacao,
        dataValidade: pb.dataValidade,
        detalhes: pb.detalhes,
        observacoes: pb.observacoes,
        risco: "",
        estrategiaSugerida: "",
        classificacao: mp.classificacao,
      });
    }

    if (matchedRows.length === 0) {
      throw new Error(
        "Nenhum dos produtos da planilha de Produtos Bloqueados foi encontrado na base de Matérias-Primas."
      );
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Querida Labs";
    workbook.created = new Date();

    const columnsConfig = [
      { header: "Código do Produto", key: "codigoProduto", width: 18 },
      { header: "Nome do Produto", key: "nomeProduto", width: 38 },
      { header: "Lote", key: "lote", width: 16 },
      { header: "Distribuída", key: "distribuida", width: 22 },
      { header: "Saldo de Estoque", key: "saldoEstoque", width: 18 },
      { header: "Status", key: "status", width: 16 },
      { header: "Data de Fabricação", key: "dataFabricacao", width: 20 },
      { header: "Data de Validade", key: "dataValidade", width: 18 },
      { header: "Detalhes", key: "detalhes", width: 24 },
      { header: "Observações", key: "observacoes", width: 24 },
      { header: "Risco", key: "risco", width: 15 },
      { header: "Estratégia Sugerida", key: "estrategiaSugerida", width: 22 },
    ];

    const formatSheet = (sheetName: string, rows: RevalidacaoFinalRow[]) => {
      const sheet = workbook.addWorksheet(sheetName);
      sheet.columns = columnsConfig;

      // Style Header
      const headerRow = sheet.getRow(1);
      headerRow.height = 26;
      headerRow.font = { bold: true, color: { argb: "FFFFFF" }, size: 11 };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0F172A" }, // Slate 900
      };
      headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };

      // Add Rows
      rows.forEach((r) => {
        const addedRow = sheet.addRow({
          codigoProduto: r.codigoProduto,
          nomeProduto: r.nomeProduto,
          lote: r.lote,
          distribuida: r.distribuida,
          saldoEstoque: r.saldoEstoque,
          status: r.status,
          dataFabricacao: r.dataFabricacao,
          dataValidade: r.dataValidade,
          detalhes: r.detalhes,
          observacoes: r.observacoes,
          risco: "",
          estrategiaSugerida: "",
        });

        addedRow.alignment = { vertical: "middle" };
      });

      // Add border grid
      sheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "E2E8F0" } },
            left: { style: "thin", color: { argb: "E2E8F0" } },
            bottom: { style: "thin", color: { argb: "E2E8F0" } },
            right: { style: "thin", color: { argb: "E2E8F0" } },
          };
        });
      });
    };

    // Tab 1: Geral (All matched rows)
    formatSheet(geralTabName, matchedRows);

    // Tab 2: Vendas (Exclude "Amostra")
    const vendasRows = matchedRows.filter((r) => r.classificacao !== "Amostra");
    formatSheet(vendasTabName, vendasRows);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
