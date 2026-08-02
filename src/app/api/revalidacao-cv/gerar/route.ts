import { NextResponse, type NextRequest } from "next/server";
import { RevalidacaoService } from "@/lib/services/revalidacao/revalidacao.service";
import { MateriaPrimaModel } from "@/lib/models/materia-prima.model";
import { verifyToken } from "@/lib/jwt";

async function checkAuth(request: NextRequest) {
  const authToken = request.cookies.get("auth-token")?.value;
  if (!authToken) return false;
  const payload = await verifyToken(authToken);
  return !!payload;
}

export async function POST(request: NextRequest) {
  try {
    if (!(await checkAuth(request))) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const baseTabName = (formData.get("baseTabName") as string) || "Revalidação CV";

    if (!file) {
      return NextResponse.json(
        { message: "A planilha de Produtos Bloqueados é obrigatória." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // 1. Parse Produtos Bloqueados spreadsheet
    const produtosBloqueados = RevalidacaoService.parseProdutosBloqueadosSpreadsheet(fileBuffer);

    // 2. Load Matérias-Primas Map from MongoDB
    const mpMap = await MateriaPrimaModel.getAllAsMap();

    if (mpMap.size === 0) {
      return NextResponse.json(
        {
          message:
            "A base de dados de Matérias-Primas está vazia. Por favor, cadastre ou importe as Matérias-Primas antes de gerar a planilha de revalidação.",
        },
        { status: 400 }
      );
    }

    // 3. Generate final Excel buffer
    const excelBuffer = await RevalidacaoService.generateRevalidationWorkbook(
      produtosBloqueados,
      mpMap,
      baseTabName
    );

    const downloadBuffer = excelBuffer.buffer.slice(
      excelBuffer.byteOffset,
      excelBuffer.byteOffset + excelBuffer.byteLength
    ) as ArrayBuffer;

    const safeFileName = baseTabName
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .toLowerCase();

    return new NextResponse(downloadBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Planilha_Revalidacao_${safeFileName}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("[POST /api/revalidacao-cv/gerar] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao gerar a planilha de revalidação.";
    return NextResponse.json({ message: errorMessage }, { status: 400 });
  }
}
