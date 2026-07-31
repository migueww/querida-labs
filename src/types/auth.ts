export type UserRole = "admin" | "user";

export interface User {
  _id?: string;
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthJWTPayload {
  sub: string; // User ID
  email: string;
  name: string;
  role: UserRole;
  image?: string;
  iat?: number;
  exp?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
