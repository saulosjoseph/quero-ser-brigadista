import { NextResponse } from "next/server";
import { listarCadastros, salvarCadastro, NovoCadastroInput } from "@/lib/cadastros";

export async function GET() {
  try {
    const cadastros = await listarCadastros();
    return NextResponse.json({ success: true, total: cadastros.length, cadastros });
  } catch (error) {
    console.error("Erro na API GET /api/cadastros:", error);
    return NextResponse.json(
      { success: false, error: "Não foi possível carregar os cadastros." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      nome,
      dataNascimento,
      email,
      telefone,
      estado,
      cidade,
      zonaRural,
      bairro,
      comunidade,
    } = body;

    // Validações obrigatórias
    if (!nome || typeof nome !== "string" || !nome.trim()) {
      return NextResponse.json(
        { success: false, error: "O campo Nome Completo é obrigatório." },
        { status: 400 }
      );
    }

    if (!dataNascimento || typeof dataNascimento !== "string") {
      return NextResponse.json(
        { success: false, error: "A Data de Nascimento é obrigatória." },
        { status: 400 }
      );
    }

    if (email && (typeof email !== "string" || (email.trim() && !email.includes("@")))) {
      return NextResponse.json(
        { success: false, error: "Informe um e-mail válido." },
        { status: 400 }
      );
    }

    if (!telefone || typeof telefone !== "string" || telefone.trim().length < 8) {
      return NextResponse.json(
        { success: false, error: "Informe um telefone/WhatsApp válido com DDD." },
        { status: 400 }
      );
    }

    if (!estado || typeof estado !== "string" || estado.trim().length !== 2) {
      return NextResponse.json(
        { success: false, error: "Selecione o Estado (UF)." },
        { status: 400 }
      );
    }

    if (!cidade || typeof cidade !== "string" || !cidade.trim()) {
      return NextResponse.json(
        { success: false, error: "O campo Cidade é obrigatório." },
        { status: 400 }
      );
    }

    const isRural = Boolean(zonaRural);

    if (isRural && (!comunidade || !String(comunidade).trim())) {
      return NextResponse.json(
        { success: false, error: "Para zona rural, informe o nome da Comunidade." },
        { status: 400 }
      );
    }

    if (!isRural && (!bairro || !String(bairro).trim())) {
      return NextResponse.json(
        { success: false, error: "Para zona urbana, informe o nome do Bairro." },
        { status: 400 }
      );
    }

    const inputData: NovoCadastroInput = {
      nome: nome.trim(),
      dataNascimento: dataNascimento.trim(),
      email: typeof email === "string" && email.trim() ? email.trim().toLowerCase() : "",
      telefone: telefone.trim(),
      estado: estado.trim().toUpperCase(),
      cidade: cidade.trim(),
      zonaRural: isRural,
      comunidade: isRural ? String(comunidade).trim() : undefined,
      bairro: !isRural ? String(bairro).trim() : undefined,
    };

    const novoCadastro = await salvarCadastro(inputData);

    return NextResponse.json(
      {
        success: true,
        message: "Cadastro realizado com sucesso! Servir ao povo de todo o coração!",
        cadastros: novoCadastro,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro na API POST /api/cadastros:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno ao processar cadastro." },
      { status: 500 }
    );
  }
}
