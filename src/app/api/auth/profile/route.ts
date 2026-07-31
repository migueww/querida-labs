import { NextResponse, type NextRequest } from "next/server";
import { verifyToken, signToken } from "@/lib/jwt";
import { UserModel } from "@/lib/models/user.model";
import { AuthService } from "@/lib/services/auth.service";
import path from "path";
import fs from "fs/promises";

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { message: "Sessão inválida ou expirada." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const name = formData.get("name") as string | null;
    const password = formData.get("password") as string | null;
    const file = formData.get("photo") as File | null;

    // Validate user in DB (fallback to token if DB offline)
    let user = null;
    let dbOffline = false;
    
    try {
      user = await UserModel.findById(payload.sub);
    } catch (e) {
      console.warn("[PUT /api/auth/profile] DB lookup failed, assuming DB offline.", e);
      dbOffline = true;
    }

    if (!user && !dbOffline) {
      return NextResponse.json(
        { message: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    // If DB is offline, we use a mock user object based on the payload to proceed with the update locally
    if (!user) {
      user = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        image: (payload as any).image,
      } as any; // Cast as any because we don't have full User object
    }

    const updates: any = {};

    if (name && name.trim()) {
      updates.name = name.trim();
    }

    if (password && password.trim()) {
      if (password.length < 6) {
        return NextResponse.json(
          { message: "A senha deve ter pelo menos 6 caracteres." },
          { status: 400 }
        );
      }
      updates.passwordHash = await AuthService.hashPassword(password);
    }

    if (file && file.size > 0) {
      // Limit file size to 10MB
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { message: "A imagem deve ter no máximo 10MB." },
          { status: 400 }
        );
      }

      // Restrict format to png or jpeg
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { message: "A imagem deve ser do formato PNG ou JPEG." },
          { status: 400 }
        );
      }

      // Create uploads directory if it doesn't exist
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      try {
        await fs.access(uploadDir);
      } catch {
        await fs.mkdir(uploadDir, { recursive: true });
      }

      // Save file
      const ext = path.extname(file.name) || (file.type === "image/png" ? ".png" : ".jpg");
      const filename = `avatar-${Date.now()}${ext}`;
      const filePath = path.join(uploadDir, filename);
      
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);

      updates.image = `/uploads/${filename}`;
    }

    // Try to update user in DB
    let updatedUser = null;
    
    if (!dbOffline && user!.id !== "fallback-admin-id") {
      try {
        updatedUser = await UserModel.update(user!.id, updates);
      } catch (error: any) {
        console.warn("[PUT /api/auth/profile] Error updating DB:", error);
        dbOffline = true;
      }
    } else {
       dbOffline = true;
    }

    if (!updatedUser && !dbOffline) {
      return NextResponse.json(
        { message: "Erro ao atualizar perfil no banco." },
        { status: 500 }
      );
    }

    // Create the final user object to return and to encode in the new token
    const finalUser = updatedUser ? UserModel.toDTO(updatedUser) : {
      id: user!.id,
      name: updates.name || user!.name,
      email: user!.email,
      role: user!.role,
      image: updates.image || user!.image,
      createdAt: user!.createdAt ? new Date(user!.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Reissue JWT to keep the session in sync (especially if DB is offline)
    const newToken = await signToken({
      sub: finalUser.id,
      email: finalUser.email,
      name: finalUser.name,
      role: finalUser.role,
      image: finalUser.image,
    });

    const response = NextResponse.json({
      message: "Perfil atualizado com sucesso" + (dbOffline ? " (Modo Offline)" : "."),
      user: finalUser,
    });

    response.cookies.set("auth-token", newToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error("[PUT /api/auth/profile] Error:", error);
    
    // Check if error is related to MongoDB connection
    if (error?.code === 'ECONNREFUSED' || error?.name === 'MongoServerSelectionError' || error?.message?.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { message: "Não foi possível conectar ao banco de dados. Tente novamente mais tarde." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { message: "Erro interno ao atualizar perfil." },
      { status: 500 }
    );
  }
}
