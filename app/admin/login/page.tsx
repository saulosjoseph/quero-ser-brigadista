"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!email.trim() || !senha) {
      setErro("Preencha o e-mail e a senha para continuar.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          senha,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push("/admin");
        router.refresh();
      } else {
        setErro(
          data.error ||
            "Acesso negado. Verifique suas credenciais de administrador."
        );
      }
    } catch (err) {
      console.error("Erro ao realizar login:", err);
      setErro("Falha de conexão com o servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF4E6]">
      {/* TARJA SUPERIOR COM LEMA E IDENTIDADE */}
      <header className="w-full bg-[#18181B] text-[#FAF4E6] border-b-4 border-[#B91C1C] py-3 px-4 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <span className="bg-[#B91C1C] text-white font-poster text-xs uppercase px-2.5 py-1 border border-white">
              ÁREA RESTRITA
            </span>
            <div>
              <h1 className="font-poster text-xl sm:text-2xl tracking-wide uppercase text-[#FEF08A]">
                BRIGADAS POPULARES &bull; CONTROLE INTERNO
              </h1>
              <p className="text-xs text-zinc-300">
                Acesso Exclusivo à Coordenação e Administração
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#B91C1C] px-3 py-1 text-xs font-poster uppercase text-[#FEF08A] border border-[#FEF08A]">
              &ldquo;Servir ao povo de todo o coração&rdquo;
            </div>
            <Link
              href="/"
              className="text-xs uppercase font-bold text-zinc-300 hover:text-white underline decoration-dashed"
            >
              &larr; Voltar ao Site
            </Link>
          </div>
        </div>
      </header>

      {/* CONTEÚDO CENTRAL: CARD DE LOGIN */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md bg-[#FFFDF8] border-4 border-[#18181B] p-6 sm:p-8 shadow-poster flex flex-col gap-6">
          {/* CABEÇALHO DO CARD */}
          <div className="border-b-2 border-[#18181B] pb-4 text-center">
            <span className="inline-block bg-[#18181B] text-[#FEF08A] font-poster text-xs uppercase px-2.5 py-0.5 mb-2">
              ACESSO RESTRITO
            </span>
            <h2 className="font-poster text-2xl sm:text-3xl uppercase tracking-wide text-[#18181B]">
              LOGIN DE ADMINISTRADOR
            </h2>
          </div>

          {/* MENSAGEM DE ERRO */}
          {erro && (
            <div className="bg-[#FEE2E2] border-2 border-[#B91C1C] text-[#991B1B] p-3 text-xs font-medium shadow-poster-sm">
              <div className="flex items-start gap-2">
                <span className="font-bold text-sm leading-none">&times;</span>
                <span>{erro}</span>
              </div>
            </div>
          )}

          {/* FORMULÁRIO DE LOGIN */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="font-poster text-xs uppercase tracking-wide text-[#18181B]"
              >
                E-mail do Administrador
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@brigadas.org"
                className="w-full bg-[#FAF4E6] border-2 border-[#18181B] p-3 text-sm font-medium text-[#18181B] placeholder:text-zinc-400 focus:outline-none focus:border-[#B91C1C] focus:bg-white shadow-poster-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="senha"
                className="font-poster text-xs uppercase tracking-wide text-[#18181B]"
              >
                Senha de Acesso
              </label>
              <input
                id="senha"
                type="password"
                required
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#FAF4E6] border-2 border-[#18181B] p-3 text-sm font-medium text-[#18181B] placeholder:text-zinc-400 focus:outline-none focus:border-[#B91C1C] focus:bg-white shadow-poster-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-2 py-3 px-4 font-poster text-lg uppercase tracking-wide border-2 border-[#18181B] transition-all cursor-pointer ${
                loading
                  ? "bg-zinc-400 text-zinc-700 cursor-not-allowed"
                  : "bg-[#B91C1C] text-white hover:bg-[#991B1B] shadow-poster active:translate-x-[2px] active:translate-y-[2px]"
              }`}
            >
              {loading ? "Autenticando..." : "Entrar no Painel"}
            </button>

            <p className="text-[11px] text-center text-[#71717A] mt-2 leading-relaxed">
              🔒 Acesso restrito a administradores credenciados. As informações pessoais tratadas neste sistema são protegidas pela LGPD (Lei nº 13.709/2018).
            </p>
          </form>
        </div>
      </main>

      {/* RODAPÉ */}
      <footer className="w-full bg-[#18181B] text-[#FAF4E6] border-t-4 border-[#18181B] py-4 px-4 text-center text-xs text-zinc-400">
        Painel de Gestão e Articulação Territorial &bull; Brigadas Populares
      </footer>
    </div>
  );
}
