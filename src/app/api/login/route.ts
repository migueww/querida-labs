import { NextResponse } from "next/server";
import { signToken } from "@/lib/jwt";

const DEFAULT_EMAIL = "ana.clara@coneqt.com";
const DEFAULT_PASSWORD = "querida_2509";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const isValid =
    email === DEFAULT_EMAIL && password === DEFAULT_PASSWORD;

  if (!isValid) {
    return NextResponse.json(
      { message: "Credenciais inválidas." },
      { status: 401 }
    );
  }

  // Gera o JWT token
  const token = await signToken({ email });

  const response = NextResponse.json(
    { message: "Login realizado com sucesso." },
    { status: 200 }
  );

  // Define o token JWT no cookie
  response.cookies.set("auth-token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });

  return response;
}


