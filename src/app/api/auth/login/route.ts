import { NextResponse } from "next/server";
import { AuthService } from "@/lib/services/auth.service";
import { signToken } from "@/lib/jwt";
import { UserModel } from "@/lib/models/user.model";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
      return NextResponse.json(
        { message: "E-mail e senha são obrigatórios." },
        { status: 400 }
      );
    }

    const { email, password } = body;

    const user = await AuthService.authenticate({ email, password });

    if (!user) {
      return NextResponse.json(
        { message: "Credenciais inválidas. Verifique seu e-mail e senha." },
        { status: 401 }
      );
    }

    // Generate JWT payload
    const token = await signToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      image: user.image,
    });

    const userDTO = UserModel.toDTO(user);

    const response = NextResponse.json(
      {
        message: "Login realizado com sucesso.",
        user: userDTO,
      },
      { status: 200 }
    );

    // Set secure HTTP-only auth token cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("[POST /api/auth/login] Error:", error);
    return NextResponse.json(
      { message: "Erro interno no servidor ao realizar login." },
      { status: 500 }
    );
  }
}
