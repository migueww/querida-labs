import { NextResponse, type NextRequest } from "next/server";
import { MateriaPrimaModel } from "@/lib/models/materia-prima.model";
import { verifyToken } from "@/lib/jwt";

async function checkAuth(request: NextRequest) {
  const authToken = request.cookies.get("auth-token")?.value;
  if (!authToken) return false;
  const payload = await verifyToken(authToken);
  return !!payload;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await checkAuth(request))) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    const updated = await MateriaPrimaModel.update(id, body);
    if (!updated) {
      return NextResponse.json(
        { message: "Matéria-Prima não encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Matéria-Prima atualizada com sucesso.", data: MateriaPrimaModel.toDTO(updated) },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PUT /api/revalidacao-cv/materia-prima/[id]] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar Matéria-Prima.";
    return NextResponse.json({ message: errorMessage }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await checkAuth(request))) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const success = await MateriaPrimaModel.delete(id);
    if (!success) {
      return NextResponse.json(
        { message: "Matéria-Prima não encontrada ou já removida." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Matéria-Prima excluída com sucesso." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[DELETE /api/revalidacao-cv/materia-prima/[id]] Error:", error);
    return NextResponse.json(
      { message: "Erro ao excluir Matéria-Prima." },
      { status: 500 }
    );
  }
}
