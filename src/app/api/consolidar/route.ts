import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

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

    // Array para armazenar todos os dados consolidados
    const consolidatedData: any[] = [];

    // Processa cada arquivo
    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });

        // Pega a primeira planilha (ou você pode especificar o nome)
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Converte para JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
        });

        // Remove a primeira linha se for cabeçalho (opcional)
        // Se o arquivo de exemplo tem cabeçalho, vamos manter e processar
        const rows = jsonData as any[][];

        // Adiciona os dados ao array consolidado
        // Se for a primeira iteração, inclui o cabeçalho
        if (consolidatedData.length === 0 && rows.length > 0) {
          // Adiciona o cabeçalho
          consolidatedData.push(rows[0]);
        }

        // Adiciona as linhas de dados (pula o cabeçalho se já foi adicionado)
        const startRow = consolidatedData.length === 1 ? 1 : 0;
        for (let i = startRow; i < rows.length; i++) {
          // Só adiciona linhas que não estão vazias
          if (rows[i].some((cell) => cell !== "" && cell !== null && cell !== undefined)) {
            consolidatedData.push(rows[i]);
          }
        }
      } catch (error) {
        console.error(`Erro ao processar arquivo ${file.name}:`, error);
        // Continua processando outros arquivos mesmo se um falhar
      }
    }

    if (consolidatedData.length === 0) {
      return NextResponse.json(
        { message: "Nenhum dado foi encontrado nos arquivos." },
        { status: 400 }
      );
    }

    // Cria uma nova planilha com os dados consolidados
    const newWorkbook = XLSX.utils.book_new();
    const newWorksheet = XLSX.utils.aoa_to_sheet(consolidatedData);
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

