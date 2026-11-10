import { NextResponse } from "next/server";
import { destruirSessaoAdmin } from "@/lib/auth";

export async function POST() {
  try {
    await destruirSessaoAdmin();
    return NextResponse.json({
      success: true,
      message: "Sessão encerrada com sucesso.",
    });
  } catch (error) {
    console.error("Erro na API de logout admin:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao encerrar sessão." },
      { status: 500 }
    );
  }
}
