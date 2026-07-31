import bcrypt from "bcryptjs";
import { UserModel } from "@/lib/models/user.model";
import { ensureAdminUser } from "@/lib/db/seed";
import { User, LoginCredentials } from "@/types/auth";

export class AuthService {
  public static async authenticate({
    email,
    password,
  }: LoginCredentials): Promise<User | null> {
    const normalizedEmail = email.toLowerCase().trim();
    
    if (!normalizedEmail || !password) {
      return null;
    }

    try {
      // 1. Try finding the user in MongoDB
      let user = await UserModel.findByEmail(normalizedEmail);

      // 2. If no user was found, trigger auto-seeding for default admin
      if (!user) {
        await ensureAdminUser();
        user = await UserModel.findByEmail(normalizedEmail);
      }

      // 3. Validate user & compare hashed password
      if (user) {
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (isPasswordValid) {
          return user;
        }
      }

      return null;
    } catch (error) {
      console.error("[AuthService] Database connection error during login:", error);

      // Fallback for development/initial setup if database connection fails or URI password isn't set yet:
      if (
        normalizedEmail === "ana.clara@coneqt.com" &&
        password === "querida_2509"
      ) {
        console.warn(
          "[AuthService] Using fallback administrator credentials (MongoDB connection string needs real password)."
        );
        return {
          id: "fallback-admin-id",
          name: "Ana Clara",
          email: "ana.clara@coneqt.com",
          passwordHash: "",
          role: "admin",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      return null;
    }
  }

  public static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
