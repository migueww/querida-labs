import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { RevalidacaoService } from "../lib/services/revalidacao/revalidacao.service";
import { MateriaPrima, ProdutoBloqueadoRow } from "../types/revalidacao";

describe("RevalidacaoService", () => {
  it("should format Excel date serial numbers correctly", () => {
    // 46101 is around 2026
    const formatted = RevalidacaoService.formatDate(46101);
    expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it("should fail validation if raw materials spreadsheet contains conflicting duplicate codes", async () => {
    // Create in-memory workbook with duplicate codes but different names
    const wsData = [
      ["Código do Produto", "Nome do Produto", "Distribuidor"],
      ["123", "Produto A", "ECKART"],
      ["123", "Produto B", "ECKART"], // Conflict!
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "MP");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    await expect(RevalidacaoService.parseAndValidateMPSpreadsheet(buffer)).rejects.toThrow(
      /códigos duplicados com informações conflitantes/
    );
  });

  it("should generate Excel workbook with Geral and Vendas tabs and exclude Amostra in Vendas tab", async () => {
    const materiaPrimaMap = new Map<string, MateriaPrima>();

    // Product 1: Regular
    materiaPrimaMap.set("4009385", {
      id: "1",
      codigoProduto: "4009385",
      nomeProduto: "Produto Regular",
      distribuidor: "ECKART",
      classificacao: "Regular",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Product 2: Amostra (starts with 85)
    materiaPrimaMap.set("8515518", {
      id: "2",
      codigoProduto: "8515518",
      nomeProduto: "Produto Amostra",
      distribuidor: "BYK",
      classificacao: "Amostra",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const produtosBloqueados: ProdutoBloqueadoRow[] = [
      {
        codigoProduto: "4009385",
        nomeProduto: "Produto Regular PB",
        lote: "LOTE001",
        saldoEstoque: 100,
        status: "Liberado",
        dataFabricacao: "01/01/2026",
        dataValidade: "01/01/2028",
        detalhes: "OK",
        observacoes: "Liberado",
        distribuida: "ECKART",
        qtdPendentePedidos: 0,
      },
      {
        codigoProduto: "8515518",
        nomeProduto: "Produto Amostra PB",
        lote: "LOTE002",
        saldoEstoque: 5,
        status: "Bloqueado",
        dataFabricacao: "01/01/2026",
        dataValidade: "01/01/2028",
        detalhes: "Amostra",
        observacoes: "Bloqueado",
        distribuida: "BYK",
        qtdPendentePedidos: 0,
      },
      {
        codigoProduto: "9999999", // Does NOT exist in MP map
        nomeProduto: "Produto Desconhecido",
        lote: "LOTE003",
        saldoEstoque: 50,
        status: "Bloqueado",
        dataFabricacao: "01/01/2026",
        dataValidade: "01/01/2028",
        detalhes: "Desconhecido",
        observacoes: "Ignorado",
        distribuida: "NÃO ATRIBUIDO",
        qtdPendentePedidos: 0,
      },
    ];

    const resultBuffer = await RevalidacaoService.generateRevalidationWorkbook(
      produtosBloqueados,
      materiaPrimaMap,
      "Revalidação CV 2026"
    );

    expect(resultBuffer).toBeInstanceOf(Buffer);

    // Re-parse generated buffer with ExcelJS to verify tabs & content
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(resultBuffer as any);

    expect(workbook.worksheets.length).toBe(2);
    const geralSheet = workbook.getWorksheet("Revalidação CV 2026");
    const vendasSheet = workbook.getWorksheet("Revalidação CV 2026 - VENDAS");

    expect(geralSheet).toBeDefined();
    expect(vendasSheet).toBeDefined();

    // Geral sheet has header + 2 matched rows (4009385 & 8515518)
    expect(geralSheet!.rowCount).toBe(3);

    // Vendas sheet has header + 1 matched row (only 4009385, 8515518 excluded)
    expect(vendasSheet!.rowCount).toBe(2);
    expect(vendasSheet!.getRow(2).getCell(1).value).toBe("4009385");
  });
});
