import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";

const PUBLIC_PATHS = ["/login", "/api/login", "/api/auth/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow static assets, images, next system routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp)$/)
  ) {
    return NextResponse.next();
  }

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path)
  );

  const isApiRoute = pathname.startsWith("/api/");
  const authToken = request.cookies.get("auth-token")?.value;

  // 2. Verify token if token exists
  let isAuthenticated = false;
  if (authToken) {
    const payload = await verifyToken(authToken);
    if (payload) {
      isAuthenticated = true;
    }
  }

  // 3. Handle Public Paths
  if (isPublicPath) {
    if (isAuthenticated && pathname === "/login") {
      return NextResponse.redirect(new URL("/consolidador-xlsx", request.url));
    }
    return NextResponse.next();
  }

  // 4. Handle Unauthenticated Requests
  if (!isAuthenticated) {
    // For API endpoints, return JSON 401 Unauthorized instead of HTML redirect
    if (isApiRoute) {
      return NextResponse.json(
        { message: "Sessão não autorizada ou expirada." },
        { status: 401 }
      );
    }

    // For web page requests, redirect to login page
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);

    const response = NextResponse.redirect(loginUrl);
    if (authToken) {
      response.cookies.delete("auth-token");
    }
    return response;
  }

  // 5. Handle authenticated root route "/"
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/consolidador-xlsx", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
};
