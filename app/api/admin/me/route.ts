import { NextResponse } from "next/server";
import { obterSessaoAdmin, verificarAdminAtivoNoBanco } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const sessao = await obterSessaoAdmin(request);

    if (!sessao) {
      return NextResponse.json(
        { success: false, error: "Não autenticado." },
        { status: 401 }
      );
    }

    // Valida também se continua ativo no banco
    const ativo = await verificarAdminAtivoNoBanco(sessao.id);
    if (!ativo) {
      return NextResponse.json(
        { success: false, error: "Usuário administrador inativo ou removido." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: sessao.id,
        nome: sessao.nome,
        email: sessao.email,
      },
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_")
    ) {
      throw error;
    }
    console.error("Erro na API /api/admin/me:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
