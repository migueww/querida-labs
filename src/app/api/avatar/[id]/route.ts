import { NextResponse, type NextRequest } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;

    if (!id) {
      return new NextResponse("ID inválido", { status: 400 });
    }

    const db = await getDatabase();
    const avatar = await db.collection("avatars").findOne({ userId: id });

    if (!avatar || !avatar.data) {
      return new NextResponse("Avatar não encontrado", { status: 404 });
    }

    const buffer = Buffer.from(avatar.data, "base64");
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": avatar.contentType || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[GET /api/avatar/[id]] Erro ao buscar avatar:", error);
    return new NextResponse("Erro interno no servidor", { status: 500 });
  }
}
