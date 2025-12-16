import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json(
    { message: "Logout realizado com sucesso." },
    { status: 200 }
  );

  // Remove o token JWT
  response.cookies.delete("auth-token");

  return response;
}

