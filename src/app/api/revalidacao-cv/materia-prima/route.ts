import { NextResponse, type NextRequest } from "next/server";
import { MateriaPrimaModel } from "@/lib/models/materia-prima.model";
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "15", 10);
    const classificacao = searchParams.get("classificacao") || "ALL";

    const result = await MateriaPrimaModel.findAll({
      search,
      page,
      pageSize,
      classificacao,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[GET /api/revalidacao-cv/materia-prima] Error:", error);
    return NextResponse.json(
      { message: "Erro ao buscar Matérias-Primas." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await checkAuth(request))) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }

    const body = await request.json();
    const { codigoProduto, nomeProduto, distribuidor } = body;

    if (!codigoProduto || !nomeProduto) {
      return NextResponse.json(
        { message: "Código e Nome do produto são obrigatórios." },
        { status: 400 }
      );
    }

    const created = await MateriaPrimaModel.create({
      codigoProduto,
      nomeProduto,
      distribuidor,
    });

    return NextResponse.json(
      { message: "Matéria-Prima cadastrada com sucesso.", data: MateriaPrimaModel.toDTO(created) },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/revalidacao-cv/materia-prima] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao cadastrar Matéria-Prima.";
    return NextResponse.json({ message: errorMessage }, { status: 400 });
  }
}
