import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

interface CompostoData {
  composto: string;
  quantidade: number;
  row: any[];
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { message: "Nenhum arquivo foi enviado." },
        { status: 400 }
      );
    }

    let headerRow: any[] = [];
    const allRows: any[][] = [];

    // Processa cada arquivo e coleta todos os dados
    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
        }) as any[][];

        if (jsonData.length === 0) continue;

        // Guarda o cabeçalho da primeira vez
        if (headerRow.length === 0 && jsonData.length > 0) {
          headerRow = jsonData[0];
        }

        // Adiciona todas as linhas de dados (pula o cabeçalho)
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          // Só adiciona linhas que não estão completamente vazias
          if (row.some((cell) => cell !== "" && cell !== null && cell !== undefined)) {
            allRows.push(row);
          }
        }
      } catch (error) {
        console.error(`Erro ao processar arquivo ${file.name}:`, error);
      }
    }

    if (headerRow.length === 0 || allRows.length === 0) {
      return NextResponse.json(
        { message: "Nenhum dado foi encontrado nos arquivos." },
        { status: 400 }
      );
    }

    // Detecta índices das colunas de composto e quantidade
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
      return NextResponse.json(
        {
          message:
            "Não foi possível identificar as colunas de composto e quantidade. Verifique se o arquivo tem cabeçalhos corretos.",
        },
        { status: 400 }
      );
    }

    // Função para parsear número com precisão de até 8 casas decimais
    function parseQuantidade(value: any): number {
      if (typeof value === "number") {
        return parseFloat(value.toFixed(8));
      }
      const str = String(value || "0")
        .trim()
        .replace(/[^\d.,-]/g, "") // Remove caracteres não numéricos exceto vírgula, ponto e menos
        .replace(",", "."); // Converte vírgula para ponto
      const num = parseFloat(str) || 0;
      return parseFloat(num.toFixed(8)); // Garante precisão de até 8 casas decimais
    }

    // Função para somar quantidades com precisão
    function somaQuantidades(a: number, b: number): number {
      const resultado = a + b;
      return parseFloat(resultado.toFixed(8));
    }

    // Agrupa por composto e soma as quantidades
    const compostoMap = new Map<string, CompostoData>();

    for (const row of allRows) {
      const composto = String(row[compostoIndex] || "").trim();
      const quantidade = parseQuantidade(row[quantidadeIndex]);

      if (!composto) continue;

      if (compostoMap.has(composto)) {
        // Se já existe, soma a quantidade com precisão
        const existing = compostoMap.get(composto)!;
        existing.quantidade = somaQuantidades(existing.quantidade, quantidade);
        // Mantém a primeira linha encontrada como base (ou você pode fazer merge de outras colunas)
      } else {
        // Cria nova entrada
        const newRow = [...row];
        newRow[quantidadeIndex] = quantidade; // Garante que a quantidade está como número
        compostoMap.set(composto, {
          composto,
          quantidade,
          row: newRow,
        });
      }
    }

    // Converte o Map para array e ordena por quantidade (decrescente)
    const consolidatedArray = Array.from(compostoMap.values())
      .sort((a, b) => {
        // Ordena com precisão de até 8 casas decimais
        const diff = b.quantidade - a.quantidade;
        return diff > 0 ? 1 : diff < 0 ? -1 : 0;
      })
      .map((item) => {
        // Atualiza a quantidade na linha com o valor consolidado (mantém precisão)
        const row = [...item.row];
        row[quantidadeIndex] = item.quantidade;
        return row;
      });

    // Adiciona o cabeçalho no início
    const finalData = [headerRow, ...consolidatedArray];

    // Cria uma nova planilha com os dados consolidados
    const newWorkbook = XLSX.utils.book_new();
    const newWorksheet = XLSX.utils.aoa_to_sheet(finalData);
    
    // Garante que a coluna de quantidade seja formatada como número com até 8 casas decimais
    const range = XLSX.utils.decode_range(newWorksheet["!ref"] || "A1");
    for (let row = 1; row <= range.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: quantidadeIndex });
      if (newWorksheet[cellAddress]) {
        const cell = newWorksheet[cellAddress];
        if (typeof cell.v === "number") {
          // Formata o número para garantir até 8 casas decimais
          cell.v = parseFloat(cell.v.toFixed(8));
          cell.z = "#,##0.########"; // Formato customizado para até 8 casas decimais
        }
      }
    }
    
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Consolidado");

    // Gera o buffer do arquivo Excel
    const excelBuffer = XLSX.write(newWorkbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Retorna o arquivo como resposta
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="consolidado_${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Erro ao consolidar arquivos:", error);
    return NextResponse.json(
      { message: "Erro ao processar os arquivos." },
      { status: 500 }
    );
  }
}

