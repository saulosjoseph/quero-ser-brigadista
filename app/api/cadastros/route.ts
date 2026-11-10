import { NextResponse } from "next/server";
import { listarCadastros, salvarCadastro, excluirCadastro, NovoCadastroInput } from "@/lib/cadastros";
import { isMaiorDeIdade } from "@/lib/types";
import { obterSessaoAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const sessao = await obterSessaoAdmin(request);
    if (!sessao) {
      return NextResponse.json(
        { success: false, error: "Acesso restrito a administradores autenticados." },
        { status: 401 }
      );
    }

    const cadastros = await listarCadastros();
    return NextResponse.json({ success: true, total: cadastros.length, cadastros });
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
      consentimentoLgpd,
      consentimentoResponsavel,
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

    // Conformidade LGPD (Art. 7º, I e Art. 8º): Consentimento informado e inequívoco
    if (!consentimentoLgpd) {
      return NextResponse.json(
        {
          success: false,
          error: "É necessário ler e aceitar a Política de Privacidade e o Termo de Consentimento para continuar.",
        },
        { status: 400 }
      );
    }

    // Conformidade LGPD (Art. 14): Para menores de 18 anos, exige confirmação de consentimento dos pais ou responsável legal
    const maiorDeIdade = isMaiorDeIdade(dataNascimento.trim());
    if (!maiorDeIdade && !consentimentoResponsavel) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Para voluntários menores de 18 anos, é obrigatório confirmar a autorização de pelo menos um dos pais ou responsável legal (Art. 14 da LGPD).",
        },
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
      consentimentoLgpd: true,
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

/**
 * DELETE /api/cadastros?id=xxx
 * Atendimento ao Art. 18 da LGPD (Direito de eliminação/exclusão dos dados pelo titular)
 */
export async function DELETE(request: Request) {
  try {
    const sessao = await obterSessaoAdmin(request);
    if (!sessao) {
      return NextResponse.json(
        { success: false, error: "Acesso restrito a administradores autenticados." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || typeof id !== "string" || !id.trim()) {
      return NextResponse.json(
        { success: false, error: "Identificador do cadastro é obrigatório para exclusão." },
        { status: 400 }
      );
    }

    await excluirCadastro(id.trim());

    return NextResponse.json({
      success: true,
      message: "Cadastro e dados pessoais excluídos com sucesso (LGPD Art. 18).",
    });
  } catch (error) {
    console.error("Erro na API DELETE /api/cadastros:", error);
    return NextResponse.json(
      { success: false, error: "Não foi possível excluir o cadastro." },
      { status: 500 }
    );
  }
}
