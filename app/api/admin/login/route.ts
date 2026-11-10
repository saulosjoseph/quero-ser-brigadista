import { NextResponse } from "next/server";
import { autenticarAdmin, criarSessaoAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, senha } = body;

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { success: false, error: "Informe o e-mail de administrador." },
        { status: 400 }
      );
    }

    if (!senha || typeof senha !== "string") {
      return NextResponse.json(
        { success: false, error: "Informe a senha de administrador." },
        { status: 400 }
      );
    }

    const admin = await autenticarAdmin(email, senha);

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Acesso negado. E-mail ou senha incorretos, ou usuário não cadastrado na tabela de administradores.",
        },
        { status: 401 }
      );
    }

    await criarSessaoAdmin(admin);

    return NextResponse.json({
      success: true,
      message: "Autenticação realizada com sucesso.",
      admin: {
        id: admin.id,
        nome: admin.nome,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Erro na API de login admin:", error);
    return NextResponse.json(
      { success: false, error: "Ocorreu um erro interno ao processar a autenticação." },
      { status: 500 }
    );
  }
}
