import { SignJWT, jwtVerify } from "jose";
import { AuthJWTPayload } from "@/types/auth";

const DEFAULT_SECRET = "querida-labs-jwt-secret-key-32-chars-long-secure-token-2026";
const SECRET_KEY = process.env.JWT_SECRET || DEFAULT_SECRET;

const secret = new TextEncoder().encode(SECRET_KEY);

export async function signToken(
  payload: Omit<AuthJWTPayload, "iat" | "exp">
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(
  token: string
): Promise<AuthJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role as "admin" | "user",
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}
