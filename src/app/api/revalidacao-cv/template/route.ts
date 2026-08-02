import { NextResponse, type NextRequest } from "next/server";
import { RevalidacaoService } from "@/lib/services/revalidacao/revalidacao.service";
import { verifyToken } from "@/lib/jwt";

async function checkAuth(request: NextRequest) {
  const authToken = request.cookies.get("auth-token")?.value;
  if (!authToken) return false;
  const payload = await verifyToken(authToken);
  return !!payload;
}

export async function GET(request: NextRequest) {
  try {
    if (!(await checkAuth(request))) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }

    const buffer = await RevalidacaoService.generateMPTemplateBuffer();

    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer;

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Modelo_Materias_Primas.xlsx"`,
      },
    });
  } catch (error) {
    console.error("[GET /api/revalidacao-cv/template] Error:", error);
    return NextResponse.json(
      { message: "Erro ao gerar modelo da planilha." },
      { status: 500 }
    );
  }
}
