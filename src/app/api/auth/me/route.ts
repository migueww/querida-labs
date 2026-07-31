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
    let dbUser = null;
    try {
      dbUser = await UserModel.findByEmail(payload.email);
    } catch (e) {
      console.warn("[GET /api/auth/me] DB lookup failed, falling back to token payload.", e);
    }

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
        image: (payload as any).image,
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
