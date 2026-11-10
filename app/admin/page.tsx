"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brigadista, calcularIdade, isMaiorDeIdade } from "@/lib/types";

type ModoAgrupamento = "estado" | "cidade" | "bairro" | "comunidade" | "todos";
type FiltroIdade = "todos" | "maiores" | "menores";

interface AdminInfo {
  id: string;
  nome: string;
  email: string;
}

export default function AdminPage() {
  const router = useRouter();

  const [cadastros, setCadastros] = useState<Brigadista[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);

  const [busca, setBusca] = useState("");
  const [agrupamento, setAgrupamento] = useState<ModoAgrupamento>("estado");
  const [filtroIdade, setFiltroIdade] = useState<FiltroIdade>("todos");

  const carregarCadastros = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch("/api/cadastros", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.cadastros)) {
        setCadastros(data.cadastros);
      } else {
        setErro("Não foi possível carregar a lista de brigadistas.");
      }
    } catch (err) {
      console.error(err);
      setErro("Falha na conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch (e) {
      console.error("Erro no logout:", e);
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }

  useEffect(() => {
    let ativo = true;

    async function carregarDadosIniciais() {
      try {
        const resMe = await fetch("/api/admin/me");
        if (resMe.status === 401) {
          router.push("/admin/login");
          return;
        }

        const dataMe = await resMe.json();
        if (!ativo) return;

        if (dataMe.success && dataMe.admin) {
          setAdminInfo(dataMe.admin);

          const resCad = await fetch("/api/cadastros", { cache: "no-store" });
          if (resCad.status === 401) {
            router.push("/admin/login");
            return;
          }

          const dataCad = await resCad.json();
          if (!ativo) return;

          if (dataCad.success && Array.isArray(dataCad.cadastros)) {
            setCadastros(dataCad.cadastros);
          } else {
            setErro("Não foi possível carregar a lista de brigadistas.");
          }
        } else {
          router.push("/admin/login");
        }
      } catch (err) {
        if (ativo) {
          console.error("Erro ao carregar dados do admin:", err);
          setErro("Falha na conexão com o servidor.");
        }
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    }

    carregarDadosIniciais();

    return () => {
      ativo = false;
    };
  }, [router]);

  // Filtro geral: busca textual + filtro de maioridade (maiores de 18 anos)
  const brigadistasFiltrados = useMemo(() => {
    return cadastros.filter((b) => {
      // Filtro de idade
      const maior = isMaiorDeIdade(b.dataNascimento);
      if (filtroIdade === "maiores" && !maior) return false;
      if (filtroIdade === "menores" && maior) return false;

      // Filtro de busca
      if (!busca.trim()) return true;
      const termo = busca.toLowerCase();
      const local = b.zonaRural ? b.comunidade || "" : b.bairro || "";

      return (
        b.nome.toLowerCase().includes(termo) ||
        (b.email || "").toLowerCase().includes(termo) ||
        b.telefone.includes(termo) ||
        b.cidade.toLowerCase().includes(termo) ||
        b.estado.toLowerCase().includes(termo) ||
        local.toLowerCase().includes(termo)
      );
    });
  }, [cadastros, busca, filtroIdade]);

  // Contadores analíticos
  const metricas = useMemo(() => {
    const total = cadastros.length;
    const maiores = cadastros.filter((b) => isMaiorDeIdade(b.dataNascimento)).length;
    const menores = total - maiores;
    const comunidadesSet = new Set<string>();
    const bairrosSet = new Set<string>();
    const cidadesSet = new Set<string>();
    const estadosSet = new Set<string>();

    cadastros.forEach((b) => {
      if (b.cidade) cidadesSet.add(b.cidade.trim().toLowerCase());
      if (b.estado) estadosSet.add(b.estado.trim().toUpperCase());
      if (b.zonaRural && b.comunidade) comunidadesSet.add(b.comunidade.trim().toLowerCase());
      if (!b.zonaRural && b.bairro) bairrosSet.add(b.bairro.trim().toLowerCase());
    });

    return {
      total,
      maiores,
      menores,
      totalComunidades: comunidadesSet.size,
      totalBairros: bairrosSet.size,
      totalCidades: cidadesSet.size,
      totalEstados: estadosSet.size,
    };
  }, [cadastros]);

  // Estruturação dos grupos solicitados pelo usuário
  const dadosAgrupados = useMemo(() => {
    const map = new Map<string, Brigadista[]>();

    brigadistasFiltrados.forEach((item) => {
      let chave = "Outros";

      if (agrupamento === "estado") {
        chave = item.estado ? `Estado: ${item.estado.toUpperCase()}` : "Estado Não Informado";
      } else if (agrupamento === "cidade") {
        chave = item.cidade ? `${item.cidade} - ${item.estado}` : "Cidade Não Informada";
      } else if (agrupamento === "bairro") {
        if (!item.zonaRural && item.bairro) {
          chave = `Bairro ${item.bairro} (${item.cidade} - ${item.estado})`;
        } else {
          chave = "Zona Rural / Comunidades (Sem Bairro)";
        }
      } else if (agrupamento === "comunidade") {
        if (item.zonaRural && item.comunidade) {
          chave = `Comunidade ${item.comunidade} (${item.cidade} - ${item.estado})`;
        } else {
          chave = "Zona Urbana / Bairros (Sem Comunidade)";
        }
      }

      if (!map.has(chave)) {
        map.set(chave, []);
      }
      map.get(chave)!.push(item);
    });

    // Ordenar chaves alfabeticamente, deixando 'Outros' / 'Sem...' pro final
    return Array.from(map.entries()).sort((a, b) => {
      if (a[0].startsWith("Zona Urbana") || a[0].startsWith("Zona Rural")) return 1;
      if (b[0].startsWith("Zona Urbana") || b[0].startsWith("Zona Rural")) return -1;
      return a[0].localeCompare(b[0]);
    });
  }, [brigadistasFiltrados, agrupamento]);

  // Atendimento ao Art. 18 da LGPD: Exclusão de dados pessoais a pedido do titular
  async function handleExcluirCadastro(id: string, nome: string) {
    const confirmou = window.confirm(
      `Confirma a exclusão definitiva dos dados de "${nome}"?\n\nEsta operação é permanente e atende à solicitação de eliminação de dados pessoais prevista no Art. 18 da LGPD.`
    );
    if (!confirmou) return;

    try {
      const res = await fetch(`/api/cadastros?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Não foi possível excluir o cadastro.");
        return;
      }
      setCadastros((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Erro ao excluir cadastro:", err);
      alert("Falha na conexão ao tentar excluir cadastro.");
    }
  }

  // Exportar dados filtrados para CSV
  function exportarCSV() {
    const cabecalho = [
      "Nome",
      "Data Nascimento",
      "Idade",
      "Maior de 18",
      "Telefone",
      "Email",
      "Estado",
      "Cidade",
      "Zona",
      "Bairro ou Comunidade",
      "Data de Cadastro",
    ];

    const linhas = brigadistasFiltrados.map((b) => {
      const idade = calcularIdade(b.dataNascimento);
      const maior = idade >= 18 ? "Sim" : "Não";
      const zona = b.zonaRural ? "Rural" : "Urbana";
      const local = b.zonaRural ? b.comunidade || "" : b.bairro || "";
      const criado = new Date(b.criadoEm).toLocaleDateString("pt-BR");

      return [
        `"${b.nome.replace(/"/g, '""')}"`,
        `"${b.dataNascimento}"`,
        idade,
        maior,
        `"${b.telefone}"`,
        `"${b.email || ""}"`,
        `"${b.estado}"`,
        `"${b.cidade}"`,
        `"${zona}"`,
        `"${local.replace(/"/g, '""')}"`,
        `"${criado}"`,
      ].join(";");
    });

    const csvContent = "\uFEFF" + [cabecalho.join(";"), ...linhas].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `brigadistas-comunitarios-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF4E6]">
      {/* TARJA SUPERIOR DO ADMIN COM LEMA */}
      <header className="w-full bg-[#18181B] text-[#FAF4E6] border-b-4 border-[#B91C1C] py-3 px-4 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <span className="bg-[#B91C1C] text-white font-poster text-xs uppercase px-2.5 py-1 border border-white">
              ÁREA RESTRITA
            </span>
            <div>
              <h1 className="font-poster text-xl sm:text-2xl tracking-wide uppercase text-[#FEF08A]">
                PAINEL ADMIN &bull; BRIGADAS COMUNITÁRIAS
              </h1>
              <p className="text-xs text-zinc-300">
                Mapeamento, Agrupamento e Articulação dos Voluntários Cadastrados
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5">
            {adminInfo && (
              <span className="text-xs text-[#FEF08A] bg-zinc-800/80 border border-zinc-700 px-2.5 py-1 font-mono">
                👤 {adminInfo.nome || adminInfo.email}
              </span>
            )}
            <div className="hidden md:block bg-[#B91C1C] px-3 py-1 text-xs font-poster uppercase text-[#FEF08A] border border-[#FEF08A]">
              &ldquo;Servir ao povo de todo o coração&rdquo;
            </div>
            <Link
              href="/"
              className="text-xs uppercase font-bold text-zinc-300 hover:text-white underline decoration-dashed"
            >
              Voltar ao Site
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="bg-[#B91C1C] text-white hover:bg-[#991B1B] text-xs font-poster uppercase px-2.5 py-1 border border-white cursor-pointer transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* AVISO DE CONFORMIDADE LGPD */}
        <section className="bg-[#FEF9C3] border-3 border-[#18181B] p-4 shadow-poster-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#713F12]">
          <div className="flex items-start gap-2">
            <span className="font-black text-base text-[#B91C1C]">🛡️</span>
            <div>
              <strong className="uppercase font-poster tracking-wide text-sm block text-[#18181B]">
                Aviso de Proteção de Dados (LGPD - Lei nº 13.709/2018)
              </strong>
              <span>
                O tratamento destas informações pessoais é restrito à finalidade legítima de articulação e capacitação comunitária de brigadistas. É dever dos administradores zelar pela confidencialidade e atender prontamente às solicitações de exclusão e retificação dos titulares.
              </span>
            </div>
          </div>
          <Link
            href="/privacidade"
            target="_blank"
            className="underline font-bold text-[#B91C1C] hover:text-[#991B1B] shrink-0 uppercase"
          >
            Ver Política de Privacidade →
          </Link>
        </section>

        {/* CARDS DE MÉTRICAS */}
        <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-[#FFFDF8] border-3 border-[#18181B] p-4 shadow-poster-sm">
            <span className="text-xs font-bold uppercase text-[#71717A] block">Total Geral</span>
            <span className="font-poster text-3xl sm:text-4xl text-[#B91C1C] block font-bold">
              {metricas.total}
            </span>
            <span className="text-[11px] text-[#27272A]">voluntários</span>
          </div>

          <div className="bg-[#DCFCE7] border-3 border-[#18181B] p-4 shadow-poster-sm">
            <span className="text-xs font-bold uppercase text-[#166534] block">Maiores de 18</span>
            <span className="font-poster text-3xl sm:text-4xl text-[#166534] block font-bold">
              {metricas.maiores}
            </span>
            <span className="text-[11px] text-[#14532D]">aptos p/ combate</span>
          </div>

          <div className="bg-[#FEF08A] border-3 border-[#18181B] p-4 shadow-poster-sm">
            <span className="text-xs font-bold uppercase text-[#854D0E] block">Menores de 18</span>
            <span className="font-poster text-3xl sm:text-4xl text-[#854D0E] block font-bold">
              {metricas.menores}
            </span>
            <span className="text-[11px] text-[#713F12]">pressão popular e apoio</span>
          </div>

          <div className="bg-[#FFFDF8] border-3 border-[#18181B] p-4 shadow-poster-sm">
            <span className="text-xs font-bold uppercase text-[#71717A] block">Comunidades</span>
            <span className="font-poster text-3xl sm:text-4xl text-[#15803D] block font-bold">
              {metricas.totalComunidades}
            </span>
            <span className="text-[11px] text-[#27272A]">zonas rurais</span>
          </div>

          <div className="bg-[#FFFDF8] border-3 border-[#18181B] p-4 shadow-poster-sm">
            <span className="text-xs font-bold uppercase text-[#71717A] block">Bairros</span>
            <span className="font-poster text-3xl sm:text-4xl text-[#B91C1C] block font-bold">
              {metricas.totalBairros}
            </span>
            <span className="text-[11px] text-[#27272A]">zonas urbanas</span>
          </div>

          <div className="bg-[#FFFDF8] border-3 border-[#18181B] p-4 shadow-poster-sm col-span-2 sm:col-span-1">
            <span className="text-xs font-bold uppercase text-[#71717A] block">Cidades</span>
            <span className="font-poster text-3xl sm:text-4xl text-[#18181B] block font-bold">
              {metricas.totalCidades}
            </span>
            <span className="text-[11px] text-[#27272A]">em {metricas.totalEstados} UF(s)</span>
          </div>
        </section>

        {/* CONTROLES: AGRUPAMENTO, FILTRO DE MAIORIDADE, BUSCA E EXPORTAÇÃO */}
        <section className="bg-[#FFFDF8] border-4 border-[#18181B] p-5 shadow-poster flex flex-col gap-5">
          {/* SELETOR DE AGRUPAMENTO SOLICITADO */}
          <div className="flex flex-col gap-2">
            <label className="font-poster text-sm uppercase text-[#18181B] flex items-center gap-2">
              <span className="bg-[#18181B] text-[#FEF08A] px-2 py-0.5 text-xs">AGRUPAR POR</span>
              <span>Escolha a forma de visualização territorial dos brigadistas:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setAgrupamento("estado")}
                className={`py-2 px-3 font-poster text-base uppercase border-2 border-[#18181B] transition-all cursor-pointer ${
                  agrupamento === "estado"
                    ? "bg-[#B91C1C] text-white shadow-poster-sm font-bold"
                    : "bg-[#F4EBD8] text-[#18181B] hover:bg-[#E5D7BC]"
                }`}
              >
                🚩 Por Estado
              </button>

              <button
                type="button"
                onClick={() => setAgrupamento("cidade")}
                className={`py-2 px-3 font-poster text-base uppercase border-2 border-[#18181B] transition-all cursor-pointer ${
                  agrupamento === "cidade"
                    ? "bg-[#B91C1C] text-white shadow-poster-sm font-bold"
                    : "bg-[#F4EBD8] text-[#18181B] hover:bg-[#E5D7BC]"
                }`}
              >
                🏙️ Por Cidade
              </button>

              <button
                type="button"
                onClick={() => setAgrupamento("bairro")}
                className={`py-2 px-3 font-poster text-base uppercase border-2 border-[#18181B] transition-all cursor-pointer ${
                  agrupamento === "bairro"
                    ? "bg-[#B91C1C] text-white shadow-poster-sm font-bold"
                    : "bg-[#F4EBD8] text-[#18181B] hover:bg-[#E5D7BC]"
                }`}
              >
                🏘️ Por Bairro
              </button>

              <button
                type="button"
                onClick={() => setAgrupamento("comunidade")}
                className={`py-2 px-3 font-poster text-base uppercase border-2 border-[#18181B] transition-all cursor-pointer ${
                  agrupamento === "comunidade"
                    ? "bg-[#166534] text-white shadow-poster-sm font-bold"
                    : "bg-[#F4EBD8] text-[#18181B] hover:bg-[#E5D7BC]"
                }`}
              >
                🌳 Por Comunidade
              </button>

              <button
                type="button"
                onClick={() => setAgrupamento("todos")}
                className={`py-2 px-3 font-poster text-base uppercase border-2 border-[#18181B] transition-all cursor-pointer col-span-2 sm:col-span-1 ${
                  agrupamento === "todos"
                    ? "bg-[#18181B] text-[#FEF08A] shadow-poster-sm font-bold"
                    : "bg-[#F4EBD8] text-[#18181B] hover:bg-[#E5D7BC]"
                }`}
              >
                📋 Lista Completa
              </button>
            </div>
          </div>

          {/* FILTRO DE MAIORIDADE (MAIORES DE 18 ANOS) E BUSCA */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end pt-2 border-t-2 border-[#E4E4E7]">
            {/* FILTRO DE MAIORIDADE */}
            <div className="md:col-span-4 flex flex-col gap-1.5">
              <label className="font-poster text-sm uppercase text-[#18181B] flex items-center justify-between">
                <span>Filtro de Maioridade</span>
                <span className="text-[11px] font-sans font-bold text-[#B91C1C]">18+ Anos</span>
              </label>
              <div className="flex border-2 border-[#18181B] bg-white shadow-poster-sm">
                <button
                  type="button"
                  onClick={() => setFiltroIdade("todos")}
                  className={`flex-1 py-1.5 px-2 text-xs font-poster uppercase cursor-pointer transition-colors ${
                    filtroIdade === "todos"
                      ? "bg-[#18181B] text-[#FEF08A] font-bold"
                      : "hover:bg-zinc-100 text-zinc-700"
                  }`}
                >
                  Todos ({metricas.total})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroIdade("maiores")}
                  className={`flex-1 py-1.5 px-2 text-xs font-poster uppercase cursor-pointer transition-colors border-l-2 border-[#18181B] ${
                    filtroIdade === "maiores"
                      ? "bg-[#166534] text-white font-bold"
                      : "hover:bg-zinc-100 text-zinc-700"
                  }`}
                >
                  18+ Anos ({metricas.maiores})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroIdade("menores")}
                  className={`flex-1 py-1.5 px-2 text-xs font-poster uppercase cursor-pointer transition-colors border-l-2 border-[#18181B] ${
                    filtroIdade === "menores"
                      ? "bg-[#B91C1C] text-white font-bold"
                      : "hover:bg-zinc-100 text-zinc-700"
                  }`}
                >
                  &lt;18 Anos ({metricas.menores})
                </button>
              </div>
            </div>

            {/* CAMPO DE BUSCA TEXTUAL */}
            <div className="md:col-span-5 flex flex-col gap-1.5">
              <label htmlFor="busca" className="font-poster text-sm uppercase text-[#18181B]">
                Busca Rápida
              </label>
              <input
                id="busca"
                type="text"
                placeholder="Filtrar por nome, cidade, bairro, comunidade..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="bg-white border-2 border-[#18181B] px-3 py-1.5 text-sm font-medium shadow-poster-sm focus:outline-none focus:ring-2 focus:ring-[#B91C1C]"
              />
            </div>

            {/* BOTÕES DE AÇÃO: EXPORTAR CSV E RECARREGAR */}
            <div className="md:col-span-3 flex items-center gap-2">
              <button
                type="button"
                onClick={exportarCSV}
                className="flex-1 bg-[#166534] hover:bg-[#14532D] text-[#FEF08A] font-poster text-sm py-2 px-3 uppercase border-2 border-[#18181B] shadow-poster-sm cursor-pointer text-center"
              >
                📥 Baixar CSV
              </button>
              <button
                type="button"
                onClick={carregarCadastros}
                title="Recarregar dados"
                className="bg-white hover:bg-zinc-100 text-[#18181B] font-poster text-sm py-2 px-3 border-2 border-[#18181B] shadow-poster-sm cursor-pointer"
              >
                🔄
              </button>
            </div>
          </div>
        </section>

        {/* FEEDBACK DE CARREGAMENTO / ERRO */}
        {loading && (
          <div className="bg-[#FEF08A] border-3 border-[#18181B] p-6 text-center shadow-poster">
            <span className="font-poster text-xl uppercase animate-pulse">
              Carregando dados dos brigadistas comunitários...
            </span>
          </div>
        )}

        {erro && (
          <div className="bg-[#FEE2E2] border-3 border-[#B91C1C] text-[#991B1B] p-4 font-bold shadow-poster">
            {erro}
          </div>
        )}

        {/* LISTAGEM DOS DADOS AGRUPADOS */}
        {!loading && !erro && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between text-xs text-[#52525B] font-bold uppercase px-1">
              <span>
                Exibindo <strong>{brigadistasFiltrados.length}</strong> de{" "}
                <strong>{cadastros.length}</strong> cadastros
              </span>
              <span>
                Filtro ativo:{" "}
                <strong className="text-[#B91C1C]">
                  {filtroIdade === "maiores"
                    ? "Apenas Maiores de 18 Anos"
                    : filtroIdade === "menores"
                    ? "Apenas Menores de 18 Anos"
                    : "Todos"}
                </strong>
              </span>
            </div>

            {agrupamento === "todos" ? (
              /* TABELA COMPLETA SEM AGRUPAMENTO */
              <div className="bg-[#FFFDF8] border-4 border-[#18181B] shadow-poster overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#18181B] text-[#FEF08A] font-poster text-sm uppercase">
                      <th className="p-3 border-b-2 border-[#18181B]">Nome</th>
                      <th className="p-3 border-b-2 border-[#18181B]">Idade</th>
                      <th className="p-3 border-b-2 border-[#18181B]">Telefone</th>
                      <th className="p-3 border-b-2 border-[#18181B]">E-mail</th>
                      <th className="p-3 border-b-2 border-[#18181B]">Cidade / UF</th>
                      <th className="p-3 border-b-2 border-[#18181B]">Zona</th>
                      <th className="p-3 border-b-2 border-[#18181B]">Bairro / Comunidade</th>
                      <th className="p-3 border-b-2 border-[#18181B] text-center">Ação LGPD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E4E7] text-sm">
                    {brigadistasFiltrados.map((b) => {
                      const idade = calcularIdade(b.dataNascimento);
                      const maior = idade >= 18;
                      return (
                        <tr key={b.id} className="hover:bg-[#FAF4E6]">
                          <td className="p-3 font-bold text-[#18181B]">{b.nome}</td>
                          <td className="p-3 whitespace-nowrap">
                            <span
                              className={`inline-block px-2 py-0.5 text-xs font-bold font-mono border ${
                                maior
                                  ? "bg-[#DCFCE7] text-[#14532D] border-[#166534]"
                                  : "bg-[#FEE2E2] text-[#991B1B] border-[#B91C1C]"
                              }`}
                            >
                              {idade} anos ({maior ? "18+" : "&lt;18"})
                            </span>
                          </td>
                          <td className="p-3 font-mono">{b.telefone}</td>
                          <td className="p-3 text-zinc-600">{b.email || "—"}</td>
                          <td className="p-3 font-semibold">
                            {b.cidade} - {b.estado}
                          </td>
                          <td className="p-3">
                            <span
                              className={`text-[11px] font-bold uppercase px-2 py-0.5 border ${
                                b.zonaRural
                                  ? "bg-[#DCFCE7] text-[#166534] border-[#166534]"
                                  : "bg-[#F4F4F5] text-[#27272A] border-[#71717A]"
                              }`}
                            >
                              {b.zonaRural ? "Rural" : "Urbana"}
                            </span>
                          </td>
                          <td className="p-3 font-bold">
                            {b.zonaRural ? b.comunidade : b.bairro}
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleExcluirCadastro(b.id, b.nome)}
                              title="Excluir cadastro a pedido do titular (LGPD Art. 18)"
                              className="bg-[#FEE2E2] hover:bg-[#B91C1C] text-[#991B1B] hover:text-white border border-[#B91C1C] px-2 py-1 text-xs font-poster uppercase cursor-pointer transition-colors shadow-poster-sm"
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* CARDS AGRUPADOS POR ESTADO / CIDADE / BAIRRO / COMUNIDADE */
              <div className="flex flex-col gap-6">
                {dadosAgrupados.length === 0 ? (
                  <div className="bg-[#FFFDF8] border-3 border-[#18181B] p-8 text-center shadow-poster">
                    <p className="font-poster text-xl text-[#71717A] uppercase">
                      Nenhum brigadista encontrado com os filtros atuais.
                    </p>
                  </div>
                ) : (
                  dadosAgrupados.map(([grupo, membros]) => (
                    <div
                      key={grupo}
                      className="bg-[#FFFDF8] border-4 border-[#18181B] shadow-poster overflow-hidden"
                    >
                      {/* CABEÇALHO DO GRUPO */}
                      <div className="bg-[#18181B] text-[#FEF08A] p-3 sm:px-5 flex items-center justify-between border-b-2 border-[#18181B]">
                        <h2 className="font-poster text-lg sm:text-xl uppercase tracking-wide">
                          {grupo}
                        </h2>
                        <span className="bg-[#B91C1C] text-white text-xs font-poster uppercase px-3 py-1 border border-white">
                          {membros.length} {membros.length === 1 ? "Voluntário" : "Voluntários"}
                        </span>
                      </div>

                      {/* LISTAGEM DOS MEMBROS DO GRUPO */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-[#F4EBD8] text-[#18181B] font-poster text-xs uppercase border-b border-[#18181B]">
                              <th className="p-2.5 sm:px-4">Nome</th>
                              <th className="p-2.5 sm:px-4">Idade</th>
                              <th className="p-2.5 sm:px-4">Telefone</th>
                              <th className="p-2.5 sm:px-4">E-mail</th>
                              <th className="p-2.5 sm:px-4">Localidade Específica</th>
                              <th className="p-2.5 sm:px-4 text-center">Ação LGPD</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E4E4E7] text-sm">
                            {membros.map((m) => {
                              const idade = calcularIdade(m.dataNascimento);
                              const maior = idade >= 18;
                              return (
                                <tr key={m.id} className="hover:bg-[#FAF4E6]">
                                  <td className="p-2.5 sm:px-4 font-bold text-[#18181B]">
                                    {m.nome}
                                  </td>
                                  <td className="p-2.5 sm:px-4 whitespace-nowrap">
                                    <span
                                      className={`inline-block px-2 py-0.5 text-xs font-bold font-mono border ${
                                        maior
                                          ? "bg-[#DCFCE7] text-[#14532D] border-[#166534]"
                                          : "bg-[#FEE2E2] text-[#991B1B] border-[#B91C1C]"
                                      }`}
                                    >
                                      {idade} anos ({maior ? "18+" : "<18"})
                                    </span>
                                  </td>
                                  <td className="p-2.5 sm:px-4 font-mono font-medium">
                                    {m.telefone}
                                  </td>
                                  <td className="p-2.5 sm:px-4 text-zinc-600">
                                    {m.email || "—"}
                                  </td>
                                  <td className="p-2.5 sm:px-4">
                                    {m.zonaRural ? (
                                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#166534]">
                                        <span className="w-2 h-2 rounded-full bg-[#166534]"></span>
                                        Comunidade: <strong>{m.comunidade}</strong> ({m.cidade} - {m.estado})
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#991B1B]">
                                        <span className="w-2 h-2 rounded-full bg-[#B91C1C]"></span>
                                        Bairro: <strong>{m.bairro}</strong> ({m.cidade} - {m.estado})
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-2.5 sm:px-4 text-center whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => handleExcluirCadastro(m.id, m.nome)}
                                      title="Excluir cadastro a pedido do titular (LGPD Art. 18)"
                                      className="bg-[#FEE2E2] hover:bg-[#B91C1C] text-[#991B1B] hover:text-white border border-[#B91C1C] px-2 py-1 text-xs font-poster uppercase cursor-pointer transition-colors shadow-poster-sm"
                                    >
                                      Excluir
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* RODAPÉ DO ADMIN */}
      <footer className="w-full bg-[#18181B] text-[#FAF4E6] border-t-4 border-[#18181B] mt-12 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs text-zinc-400">
          <div>
            Painel Administrativo Interno &bull; Acesso Restrito via URL Direta
          </div>
          <div className="font-poster text-sm uppercase text-[#FEF08A]">
            &ldquo;Servir ao povo de todo o coração&rdquo;
          </div>
        </div>
      </footer>
    </div>
  );
}
