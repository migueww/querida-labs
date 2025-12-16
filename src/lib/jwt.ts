import { SignJWT, jwtVerify, JWTPayload as JoseJWTPayload } from "jose";

const SECRET_KEY =
  process.env.JWT_SECRET || "querida-lab-secret-key-change-in-production";

const secret = new TextEncoder().encode(SECRET_KEY);

export interface AppJWTPayload {
  email: string;
  exp?: number;
}

export async function signToken(
  payload: Omit<AppJWTPayload, "exp">
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(
  token: string
): Promise<AppJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);

    if (typeof payload.email !== "string") {
      return null;
    }

    return {
      email: payload.email,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}
