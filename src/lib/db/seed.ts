import bcrypt from "bcryptjs";
import { UserModel } from "@/lib/models/user.model";
import { User } from "@/types/auth";

const DEFAULT_ADMIN_EMAIL = "ana.clara@coneqt.com";
const DEFAULT_ADMIN_PASSWORD = "querida_2509";
const DEFAULT_ADMIN_NAME = "Ana Clara";

export async function ensureAdminUser(): Promise<User | null> {
  try {
    // Check if admin user already exists
    const existingAdmin = await UserModel.findByEmail(DEFAULT_ADMIN_EMAIL);
    if (existingAdmin) {
      return existingAdmin;
    }

    // Hash default password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, saltRounds);

    // Create user in DB
    const adminUser = await UserModel.create({
      name: DEFAULT_ADMIN_NAME,
      email: DEFAULT_ADMIN_EMAIL,
      passwordHash,
      role: "admin",
    });

    console.log(`[Seed] Created initial admin user: ${adminUser.email}`);
    return adminUser;
  } catch (error) {
    console.error("[Seed] Failed to ensure admin user:", error);
    return null;
  }
}
