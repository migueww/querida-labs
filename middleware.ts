import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";

const PUBLIC_PATHS = ["/login", "/api/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permite arquivos estáticos e rotas do Next.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp)$/)
  ) {
    return NextResponse.next();
  }

  // Permite rotas públicas explícitas.
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path))) {
    // Se já está autenticado e tentando acessar /login, redireciona para consolidador
    const authToken = request.cookies.get("auth-token");
    if (authToken) {
      const isValid = await verifyToken(authToken.value);
      if (isValid && pathname === "/login") {
        return NextResponse.redirect(new URL("/consolidador-xlsx", request.url));
      }
    }
    return NextResponse.next();
  }

  // Verifica autenticação JWT para todas as outras rotas
  const authToken = request.cookies.get("auth-token");

  if (!authToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verifica se o token é válido
  const payload = await verifyToken(authToken.value);

  if (!payload) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    const response = NextResponse.redirect(loginUrl);
    // Remove o token inválido
    response.cookies.delete("auth-token");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
};


