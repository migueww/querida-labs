import { NextResponse, type NextRequest } from "next/server";
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

    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { message: "Nenhum produto selecionado para exclusão." },
        { status: 400 }
      );
    }

    const deletedCount = await MateriaPrimaModel.deleteMany(ids);

    return NextResponse.json(
      { message: `${deletedCount} matérias-primas excluídas com sucesso.`, deletedCount },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/revalidacao-cv/materia-prima/delete-bulk] Error:", error);
    return NextResponse.json(
      { message: "Erro ao excluir produtos em lote." },
      { status: 500 }
    );
  }
}
