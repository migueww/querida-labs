import { NextResponse, type NextRequest } from "next/server";
import { RevalidacaoService } from "@/lib/services/revalidacao/revalidacao.service";
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

    if (!file) {
      return NextResponse.json(
        { message: "Nenhum arquivo enviado para importação." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { resultSummary } = await RevalidacaoService.parseAndValidateMPSpreadsheet(buffer);

    return NextResponse.json(
      {
        message: `Importação concluída! Total processado: ${resultSummary.totalProcessed} (Novos: ${resultSummary.insertedCount}, Atualizados: ${resultSummary.updatedCount}).`,
        summary: resultSummary,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/revalidacao-cv/import-mp] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao importar a planilha de Matérias-Primas.";
    return NextResponse.json({ message: errorMessage }, { status: 400 });
  }
}
