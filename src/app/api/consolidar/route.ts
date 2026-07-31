import { NextResponse, type NextRequest } from "next/server";
import { ExcelService } from "@/lib/services/excel.service";
import { verifyToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    // Secondary authentication check inside API route
    const authToken = request.cookies.get("auth-token")?.value;
    if (!authToken) {
      return NextResponse.json(
        { message: "Não autorizado. Por favor faça login." },
        { status: 401 }
      );
    }

    const payload = await verifyToken(authToken);
    if (!payload) {
      return NextResponse.json(
        { message: "Sessão inválida ou expirada." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { message: "Nenhum arquivo foi enviado para consolidação." },
        { status: 400 }
      );
    }

    // Process files through domain service
    const result = await ExcelService.consolidateFiles(files);

    const arrayBuffer = result.excelBuffer.buffer.slice(
      result.excelBuffer.byteOffset,
      result.excelBuffer.byteOffset + result.excelBuffer.byteLength
    ) as ArrayBuffer;

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
        "X-Total-Compounds": String(result.totalCompounds),
        "X-Total-Quantity": String(result.totalQuantity),
      },
    });
  } catch (error) {
    console.error("[POST /api/consolidar] Consolidation error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao processar os arquivos.";
    return NextResponse.json({ message: errorMessage }, { status: 400 });
  }
}
