import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { UserModel } from "@/lib/models/user.model";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { message: "Sessão inválida ou expirada." },
        { status: 401 }
      );
    }

    // Try finding live user details in MongoDB
    const dbUser = await UserModel.findByEmail(payload.email);

    if (dbUser) {
      return NextResponse.json({ user: UserModel.toDTO(dbUser) });
    }

    // Return payload user if DB not connected
    return NextResponse.json({
      user: {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[GET /api/auth/me] Error:", error);
    return NextResponse.json(
      { message: "Erro ao buscar dados do usuário." },
      { status: 500 }
    );
  }
}
