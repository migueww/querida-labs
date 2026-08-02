import { NextResponse, type NextRequest } from "next/server";
import { MateriaPrimaModel } from "@/lib/models/materia-prima.model";
import { verifyToken } from "@/lib/jwt";
import { AuthService } from "@/lib/services/auth.service";
import { ClearBaseRateLimiter } from "@/lib/services/revalidacao/rate-limiter";

export async function POST(request: NextRequest) {
  try {
    const authToken = request.cookies.get("auth-token")?.value;
    if (!authToken) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }

    const payload = await verifyToken(authToken);
    if (!payload || !payload.email) {
      return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });
    }

    const email = payload.email.toLowerCase().trim();

    // 1. Check Rate Limit
    const rateCheck = ClearBaseRateLimiter.checkLimit(email);
    if (!rateCheck.allowed) {
      const minutesRemaining = Math.ceil(rateCheck.lockTimeRemainingMs / 60000);
      return NextResponse.json(
        {
          message: `Ação bloqueada devido a excesso de tentativas. Tente novamente em ${minutesRemaining} minuto(s).`,
          lockTimeRemainingMs: rateCheck.lockTimeRemainingMs,
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const { password } = body || {};

    if (!password) {
      return NextResponse.json(
        { message: "A senha de confirmação é obrigatória." },
        { status: 400 }
      );
    }

    // 2. Authenticate user credentials
    const authenticatedUser = await AuthService.authenticate({
      email,
      password,
    });

    if (!authenticatedUser) {
      // Record failure
      const failState = ClearBaseRateLimiter.recordFailure(email);
      if (failState.remainingAttempts === 0) {
        return NextResponse.json(
          {
            message: "Senha incorreta. Acesso bloqueado por 15 minutos.",
            remainingAttempts: 0,
            lockTimeRemainingMs: failState.lockTimeRemainingMs,
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        {
          message: `Senha incorreta. Tentativas restantes: ${failState.remainingAttempts}`,
          remainingAttempts: failState.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // 3. Clear rate limit & delete all raw materials
    ClearBaseRateLimiter.recordSuccess(email);
    const deletedCount = await MateriaPrimaModel.clearAll();

    return NextResponse.json(
      {
        message: "Toda a base de Matérias-Primas foi removida com sucesso.",
        deletedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/revalidacao-cv/materia-prima/clear-all] Error:", error);
    return NextResponse.json(
      { message: "Erro interno ao limpar a base de dados." },
      { status: 500 }
    );
  }
}
