import { SignJWT, jwtVerify } from "jose";

const SECRET_KEY = process.env.JWT_SECRET || "querida-lab-secret-key-change-in-production";
const secret = new TextEncoder().encode(SECRET_KEY);

export interface JWTPayload {
  email: string;
  exp?: number;
}

export async function signToken(payload: Omit<JWTPayload, "exp">): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  return token;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as JWTPayload;
  } catch (error) {
    return null;
  }
}

