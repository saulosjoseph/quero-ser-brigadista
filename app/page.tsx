"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import Image from "next/image";

interface EstadoIBGE {
  id: number;
  sigla: string;
  nome: string;
}

interface MunicipioIBGE {
  id: number;
  nome: string;
  microrregiao?: {
    mesorregiao?: {
      UF?: {
        id: number;
        sigla: string;
        nome: string;
      };
    };
  };
  "regiao-imediata"?: {
    "regiao-intermediaria"?: {
      UF?: {
        id: number;
        sigla: string;
        nome: string;
      };
    };
  };
}

const ESTADOS_FALLBACK: EstadoIBGE[] = [
  { id: 15, sigla: "PA", nome: "Pará" },
  { id: 12, sigla: "AC", nome: "Acre" },
  { id: 27, sigla: "AL", nome: "Alagoas" },
  { id: 16, sigla: "AP", nome: "Amapá" },
  { id: 13, sigla: "AM", nome: "Amazonas" },
  { id: 29, sigla: "BA", nome: "Bahia" },
  { id: 23, sigla: "CE", nome: "Ceará" },
  { id: 53, sigla: "DF", nome: "Distrito Federal" },
  { id: 32, sigla: "ES", nome: "Espírito Santo" },
  { id: 52, sigla: "GO", nome: "Goiás" },
  { id: 21, sigla: "MA", nome: "Maranhão" },
  { id: 51, sigla: "MT", nome: "Mato Grosso" },
  { id: 50, sigla: "MS", nome: "Mato Grosso do Sul" },
  { id: 31, sigla: "MG", nome: "Minas Gerais" },
  { id: 25, sigla: "PB", nome: "Paraíba" },
  { id: 41, sigla: "PR", nome: "Paraná" },
  { id: 26, sigla: "PE", nome: "Pernambuco" },
  { id: 22, sigla: "PI", nome: "Piauí" },
  { id: 33, sigla: "RJ", nome: "Rio de Janeiro" },
  { id: 24, sigla: "RN", nome: "Rio Grande do Norte" },
  { id: 43, sigla: "RS", nome: "Rio Grande do Sul" },
  { id: 11, sigla: "RO", nome: "Rondônia" },
  { id: 14, sigla: "RR", nome: "Roraima" },
  { id: 42, sigla: "SC", nome: "Santa Catarina" },
  { id: 35, sigla: "SP", nome: "São Paulo" },
  { id: 28, sigla: "SE", nome: "Sergipe" },
  { id: 17, sigla: "TO", nome: "Tocantins" },
];

function formatarTelefone(valor: string): string {
  const apenasDigitos = valor.replace(/\D/g, "").slice(0, 11);
  if (apenasDigitos.length <= 2) {
    return apenasDigitos.length ? `(${apenasDigitos}` : "";
  }
  if (apenasDigitos.length <= 6) {
    return `(${apenasDigitos.slice(0, 2)}) ${apenasDigitos.slice(2)}`;
  }
  if (apenasDigitos.length <= 10) {
    return `(${apenasDigitos.slice(0, 2)}) ${apenasDigitos.slice(2, 6)}-${apenasDigitos.slice(6)}`;
  }
  return `(${apenasDigitos.slice(0, 2)}) ${apenasDigitos.slice(2, 7)}-${apenasDigitos.slice(7)}`;
}

export default function Home() {
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [estado, setEstado] = useState("PA");
  const [cidade, setCidade] = useState("Santarém");
  const [zonaRural, setZonaRural] = useState(false);
  const [localidade, setLocalidade] = useState("");
  const [dataMaxima, setDataMaxima] = useState("");

  const [estados, setEstados] = useState<EstadoIBGE[]>([]);
  const [carregandoEstados, setCarregandoEstados] = useState(true);

  const [municipios, setMunicipios] = useState<MunicipioIBGE[]>([]);
  const [carregandoCidades, setCarregandoCidades] = useState(true);

  useEffect(() => {
    setDataMaxima(new Date().toISOString().split("T")[0]);
  }, []);

  // Carrega a lista de estados utilizando a API oficial do IBGE:
  // GET https://servicodados.ibge.gov.br/api/v1/localidades/estados
  useEffect(() => {
    let ativo = true;
    async function carregarEstados() {
      setCarregandoEstados(true);
      try {
        const res = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados");
        if (!res.ok) throw new Error("Erro na resposta da API de estados");
        const data: EstadoIBGE[] = await res.json();
        const ordenados = [...data].sort((a, b) => a.nome.localeCompare(b.nome));
        if (ativo) {
          setEstados(ordenados);
        }
      } catch (err) {
        console.error("Falha ao carregar estados do IBGE:", err);
        if (ativo) {
          const fallbackOrdenado = [...ESTADOS_FALLBACK].sort((a, b) => a.nome.localeCompare(b.nome));
          setEstados(fallbackOrdenado);
        }
      } finally {
        if (ativo) {
          setCarregandoEstados(false);
        }
      }
    }

    carregarEstados();
    return () => {
      ativo = false;
    };
  }, []);

  // Carrega a lista de cidades utilizando a API oficial do IBGE:
  // GET https://servicodados.ibge.gov.br/api/v1/localidades/municipios
  useEffect(() => {
    let ativo = true;
    async function carregarMunicipios() {
      setCarregandoCidades(true);
      try {
        const res = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/municipios");
        if (!res.ok) throw new Error("Erro na resposta da API de municípios");
        const data: MunicipioIBGE[] = await res.json();
        if (ativo) {
          setMunicipios(data);
        }
      } catch (err) {
        console.error("Falha ao carregar municípios do IBGE:", err);
        // Fallback: busca por estado caso a lista geral falhe
        if (estado) {
          try {
            const fallbackRes = await fetch(
              `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/municipios`
            );
            if (fallbackRes.ok && ativo) {
              const fallbackData: MunicipioIBGE[] = await fallbackRes.json();
              setMunicipios(fallbackData);
            }
          } catch (e) {
            console.error("Erro no fallback de municípios:", e);
          }
        }
      } finally {
        if (ativo) {
          setCarregandoCidades(false);
        }
      }
    }

    carregarMunicipios();
    return () => {
      ativo = false;
    };
  }, []);

  // Recarrega por estado se a lista geral estiver vazia e houver estado selecionado
  useEffect(() => {
    if (municipios.length === 0 && estado && !carregandoCidades) {
      let ativo = true;
      setCarregandoCidades(true);
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/municipios`)
        .then((r) => (r.ok ? r.json() : []))
        .then((data: MunicipioIBGE[]) => {
          if (ativo && data.length > 0) {
            setMunicipios(data);
          }
        })
        .catch((e) => console.error("Erro no carregamento por estado:", e))
        .finally(() => {
          if (ativo) setCarregandoCidades(false);
        });
      return () => {
        ativo = false;
      };
    }
  }, [estado, municipios.length, carregandoCidades]);

  // Filtra as cidades do estado selecionado
  const cidadesDoEstado = useMemo(() => {
    if (!estado) return [];

    const filtrados = municipios.filter((m) => {
      const ufSigla =
        m.microrregiao?.mesorregiao?.UF?.sigla ||
        m["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.sigla;
      return !ufSigla || ufSigla.toUpperCase() === estado.toUpperCase();
    });

    return filtrados.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [municipios, estado]);

  function handleEstadoChange(novoEstado: string) {
    setEstado(novoEstado);
    setCidade("");
  }

  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  function resetForm() {
    setNome("");
    setDataNascimento("");
    setEmail("");
    setTelefone("");
    setEstado("PA");
    setCidade("Santarém");
    setZonaRural(false);
    setLocalidade("");
    setErrorMessage(null);
    setSucesso(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!nome.trim()) {
      setErrorMessage("Por favor, preencha seu nome completo.");
      return;
    }
    if (!dataNascimento) {
      setErrorMessage("Por favor, informe sua data de nascimento.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Por favor, informe um endereço de e-mail válido.");
      return;
    }
    if (!telefone.trim() || telefone.replace(/\D/g, "").length < 10) {
      setErrorMessage("Por favor, informe seu telefone com DDD (WhatsApp).");
      return;
    }
    if (!cidade.trim()) {
      setErrorMessage("Por favor, informe a cidade.");
      return;
    }
    if (!localidade.trim()) {
      setErrorMessage(
        zonaRural
          ? "Por favor, informe o nome da sua comunidade rural."
          : "Por favor, informe o nome do seu bairro."
      );
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          nome,
          dataNascimento,
          email,
          telefone,
          estado,
          cidade,
          zonaRural,
          bairro: !zonaRural ? localidade : undefined,
          comunidade: zonaRural ? localidade : undefined,
        };

        const res = await fetch("/api/cadastros", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setErrorMessage(data.error || "Ocorreu um erro ao enviar seu cadastro.");
          return;
        }

        setSucesso(true);
      } catch (err) {
        console.error(err);
        setErrorMessage("Erro de conexão. Verifique sua rede e tente novamente.");
      }
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF4E6]">
      {/* TARJA SUPERIOR COM LEMA DE HONRA */}
      <header className="w-full bg-[#B91C1C] text-white border-b-4 border-[#18181B] py-2.5 px-4 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
          </div>
          <div className="text-xs uppercase tracking-widest font-bold text-red-100 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] inline-block animate-pulse border border-black"></span>
            Brigadas Populares Comunitárias em Ação
          </div>
        </div>
      </header>

      {/* HERO SECTION COM ESTÉTICA DE CARTAZ */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-8">
        <section className="bg-[#FFFDF8] woodcut-border shadow-poster-lg p-6 sm:p-8 lg:p-10 relative overflow-hidden">
          {/* Efeito decorativo de selo/carimbo */}
          <div className="absolute top-3 right-3 sm:top-5 sm:right-6 rotate-6 bg-[#FEF08A] text-[#713F12] border-2 border-[#18181B] px-3 py-1 font-poster text-xs sm:text-sm uppercase font-bold shadow-poster-sm">
            Mobilização Permanente
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* LADO ESQUERDO: TEXTOS E CHAMADAS */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="inline-block self-start bg-[#166534] text-[#FEF08A] font-poster text-sm sm:text-base px-3 py-1 border-2 border-[#18181B] shadow-poster-sm uppercase">
                Defesa Popular da Amazônia e do Território
              </div>

              <h1 className="font-poster text-4xl sm:text-5xl lg:text-6xl leading-[0.95] text-[#B91C1C] drop-shadow-sm">
                QUERO SER BRIGADISTA COMUNITÁRIO
              </h1>

              <div className="bg-[#18181B] text-[#FEF08A] font-poster text-2xl sm:text-3xl px-4 py-2 uppercase tracking-wide border-2 border-[#18181B] shadow-poster inline-block self-start">
                SÓ O POVO SALVA O POVO!
              </div>

              <p className="text-base sm:text-lg text-[#27272A] leading-relaxed font-medium">
                Pela estruturação e capacitação das{" "}
                <strong className="text-[#B91C1C] font-bold">
                  Brigadas Populares Comunitárias
                </strong>
                , fornecimento de EPIs e equipamentos adequados para prevenção, combate a incêndios florestais e resposta imediata em defesa das florestas, rios e das nossas famílias.
              </p>

              {/* PONTOS DE DESTAQUE */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-[#FEF9C3] p-3 border-2 border-[#18181B] shadow-poster-sm">
                  <span className="block font-poster text-lg text-[#B91C1C]">01. RESPOSTA RÁPIDA</span>
                  <span className="text-xs text-[#3F3F46]">Atuação imediata antes que o fogo tome conta.</span>
                </div>
                <div className="bg-[#DCFCE7] p-3 border-2 border-[#18181B] shadow-poster-sm">
                  <span className="block font-poster text-lg text-[#15803D]">02. COMUNIDADE UNIDA</span>
                  <span className="text-xs text-[#3F3F46]">Moradores, ribeirinhos, indígenas e quilombolas juntos.</span>
                </div>
                <div className="bg-[#FEE2E2] p-3 border-2 border-[#18181B] shadow-poster-sm">
                  <span className="block font-poster text-lg text-[#991B1B]">03. ESTRUTURAÇÃO</span>
                  <span className="text-xs text-[#3F3F46]">Exigência de apoio público, EPIs e treinamento sério.</span>
                </div>
              </div>
            </div>

            {/* LADO DIREITO: CARTAZ ILUSTRATIVO ORIGINAL */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative p-2 bg-white border-4 border-[#18181B] shadow-poster-lg rotate-1 hover:rotate-0 transition-transform duration-300 w-full max-w-sm">
                <div className="relative aspect-[3/4] w-full overflow-hidden border border-[#18181B]">
                  <Image
                    src="/images/poster-brigadistas.jpg"
                    alt="Cartaz Oficial: Só o Povo Salva o Povo! - Brigadas Comunitárias"
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="mt-2 text-center text-xs font-bold uppercase tracking-wider text-[#713F12] bg-[#FEF08A] py-1 border border-[#18181B]">
                  Cartaz de Luta Popular de Santarém-PA
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ÁREA DO FORMULÁRIO DE CADASTRO */}
        <section id="cadastro" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* COLUNA INFORMATIVA / MANIFESTO */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="bg-[#166534] text-white p-6 border-4 border-[#18181B] shadow-poster">
              <h2 className="font-poster text-2xl sm:text-3xl uppercase tracking-wide text-[#FEF08A] mb-3">
                Por Que Se Cadastrar?
              </h2>
              <p className="text-sm leading-relaxed mb-4 text-green-50">
                Os incêndios criminosos e as queimadas descontroladas ameaçam a saúde, as plantações, a água e a vida de quem vive tanto nas comunidades rurais quanto nos bairros urbanos da nossa região.
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-green-100">
                <li className="flex items-start gap-2">
                  <span className="font-black text-[#FEF08A]">✓</span>
                  <span>Mapeamento dos voluntários por território e localidade.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-black text-[#FEF08A]">✓</span>
                  <span>Formação e capacitação gratuita com brigadistas experientes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-black text-[#FEF08A]">✓</span>
                  <span>Articulação de redes comunitárias de alerta contra queimadas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-black text-[#FEF08A]">✓</span>
                  <span>Cobrança organizada por equipamentos e suporte do poder público.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* COLUNA DO FORMULÁRIO */}
          <div className="lg:col-span-7">
            <div className="bg-[#FFFDF8] border-4 border-[#18181B] shadow-poster-lg p-6 sm:p-8 relative">
              <div className="border-b-4 border-[#18181B] pb-4 mb-6">
                <span className="bg-[#B91C1C] text-white font-poster text-sm px-3 py-1 uppercase tracking-wider inline-block border-2 border-[#18181B] mb-2">
                  Inscrição de Voluntário
                </span>
                <h2 className="font-poster text-3xl sm:text-4xl uppercase text-[#18181B]">
                  Preencha Sua Ficha de Brigadista
                </h2>
                <p className="text-sm text-[#52525B] mt-1 font-medium">
                  Todos os campos são essenciais para organizar as equipes por território.
                </p>
              </div>

              {sucesso ? (
                <div className="bg-[#DCFCE7] border-4 border-[#166534] p-6 text-center flex flex-col items-center gap-4 shadow-poster">
                  <div className="w-16 h-16 rounded-full bg-[#166534] text-[#FEF08A] flex items-center justify-center font-poster text-3xl border-2 border-[#18181B]">
                    ✓
                  </div>
                  <div>
                    <span className="font-poster text-2xl sm:text-3xl text-[#166534] uppercase block">
                      CADASTRO REALIZADO COM SUCESSO!
                    </span>
                  </div>
                  <p className="text-sm text-[#1F2937] max-w-md">
                    Obrigado por se somar à luta comunitária. Suas informações foram registradas e serão articuladas pelas lideranças da brigada popular da sua região.
                  </p>
                  <button
                    onClick={resetForm}
                    className="mt-2 bg-[#18181B] text-[#FEF08A] font-poster text-lg px-6 py-2.5 uppercase border-2 border-[#18181B] shadow-poster hover:bg-[#27272A] cursor-pointer"
                  >
                    Realizar Novo Cadastro
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  {errorMessage && (
                    <div className="bg-[#FEE2E2] border-2 border-[#B91C1C] text-[#991B1B] p-3 text-sm font-semibold flex items-center gap-2 shadow-poster-sm">
                      <span className="font-black text-lg">⚠</span>
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* NOME COMPLETO */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nome" className="font-poster text-lg uppercase text-[#18181B]">
                      Nome Completo <span className="text-[#B91C1C]">*</span>
                    </label>
                    <input
                      id="nome"
                      type="text"
                      required
                      placeholder="Ex: João da Silva Ferreira"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="bg-white border-2 border-[#18181B] px-3.5 py-2.5 text-base font-medium shadow-poster-sm focus:outline-none focus:ring-2 focus:ring-[#B91C1C]"
                    />
                  </div>

                  {/* DATA DE NASCIMENTO & TELEFONE */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="dataNascimento" className="font-poster text-lg uppercase text-[#18181B]">
                        Data de Nascimento <span className="text-[#B91C1C]">*</span>
                      </label>
                      <input
                        id="dataNascimento"
                        type="date"
                        required
                        max={dataMaxima || undefined}
                        value={dataNascimento}
                        onChange={(e) => setDataNascimento(e.target.value)}
                        className="bg-white border-2 border-[#18181B] px-3.5 py-2 text-base font-medium shadow-poster-sm focus:outline-none focus:ring-2 focus:ring-[#B91C1C]"
                      />
                      <span className="text-[11px] text-[#71717A]">
                        A brigada acolhe maiores de 18 para linha de frente e jovens para apoio e prevenção.
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="telefone" className="font-poster text-lg uppercase text-[#18181B]">
                        Telefone / WhatsApp <span className="text-[#B91C1C]">*</span>
                      </label>
                      <input
                        id="telefone"
                        type="tel"
                        required
                        placeholder="(93) 99999-9999"
                        value={telefone}
                        onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                        className="bg-white border-2 border-[#18181B] px-3.5 py-2.5 text-base font-medium shadow-poster-sm focus:outline-none focus:ring-2 focus:ring-[#B91C1C]"
                      />
                    </div>
                  </div>

                  {/* EMAIL */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="font-poster text-lg uppercase text-[#18181B]">
                      E-mail <span className="text-[#B91C1C]">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="seu.email@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white border-2 border-[#18181B] px-3.5 py-2.5 text-base font-medium shadow-poster-sm focus:outline-none focus:ring-2 focus:ring-[#B91C1C]"
                    />
                  </div>

                  {/* ESTADO E CIDADE */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1 flex flex-col gap-1.5">
                      <label htmlFor="estado" className="font-poster text-lg uppercase text-[#18181B]">
                        Estado (UF) <span className="text-[#B91C1C]">*</span>
                      </label>
                      <select
                        id="estado"
                        value={estado}
                        onChange={(e) => handleEstadoChange(e.target.value)}
                        disabled={carregandoEstados && estados.length === 0}
                        className="bg-white border-2 border-[#18181B] px-3 py-2.5 text-base font-medium shadow-poster-sm focus:outline-none focus:ring-2 focus:ring-[#B91C1C] disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        {estados.length === 0 && carregandoEstados ? (
                          <option value="">Carregando estados...</option>
                        ) : (
                          estados.map((uf) => (
                            <option key={uf.id || uf.sigla} value={uf.sigla}>
                              {uf.sigla} - {uf.nome}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                      <label htmlFor="cidade" className="font-poster text-lg uppercase text-[#18181B]">
                        Cidade <span className="text-[#B91C1C]">*</span>
                      </label>
                      <select
                        id="cidade"
                        required
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        disabled={carregandoCidades && cidadesDoEstado.length === 0}
                        className="bg-white border-2 border-[#18181B] px-3.5 py-2.5 text-base font-medium shadow-poster-sm focus:outline-none focus:ring-2 focus:ring-[#B91C1C] disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {carregandoCidades && cidadesDoEstado.length === 0
                            ? "Carregando cidades do IBGE..."
                            : !estado
                            ? "Selecione o estado primeiro"
                            : "Selecione a cidade"}
                        </option>
                        {cidadesDoEstado.map((m) => (
                          <option key={m.id} value={m.nome}>
                            {m.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* CHECKBOX ZONA RURAL (SIM OU NÃO) */}
                  <div className="bg-[#FEF9C3] p-4 border-2 border-[#18181B] shadow-poster-sm flex flex-col gap-2">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={zonaRural}
                        onChange={(e) => {
                          setZonaRural(e.target.checked);
                          setLocalidade("");
                        }}
                        className="w-5 h-5 accent-[#B91C1C] border-2 border-[#18181B] rounded cursor-pointer"
                      />
                      <span className="font-poster text-lg uppercase text-[#18181B]">
                        Mora ou atua em Zona Rural? (Sim / Não)
                      </span>
                    </label>
                    <p className="text-xs text-[#713F12] pl-8">
                      Marque se você reside em comunidade ribeirinha, quilombola, indígena, assentamento ou área rural.
                    </p>
                  </div>

                  {/* CAMPO CONDICIONAL: SE ZONA RURAL = COMUNIDADE / SE NÃO = BAIRRO */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="localidade" className="font-poster text-lg uppercase text-[#18181B] flex items-center justify-between">
                      <span>
                        {zonaRural ? "Nome da Comunidade" : "Nome do Bairro"}{" "}
                        <span className="text-[#B91C1C]">*</span>
                      </span>
                      <span className="text-xs lowercase px-2 py-0.5 bg-[#E4E4E7] text-[#27272A] border border-[#18181B] font-mono">
                        {zonaRural ? "zona rural" : "zona urbana"}
                      </span>
                    </label>
                    <input
                      id="localidade"
                      type="text"
                      required
                      placeholder={
                        zonaRural
                          ? "Ex: Comunidade São Sebastião, Alter do Chão, Piquiatuba..."
                          : "Ex: Centro, Santarenzinho, Caranazal, Aldeia..."
                      }
                      value={localidade}
                      onChange={(e) => setLocalidade(e.target.value)}
                      className="bg-white border-2 border-[#18181B] px-3.5 py-2.5 text-base font-medium shadow-poster-sm focus:outline-none focus:ring-2 focus:ring-[#B91C1C]"
                    />
                  </div>

                  {/* BOTÃO DE SUBMIT */}
                  <button
                    type="submit"
                    disabled={isPending}
                    className="mt-3 bg-[#B91C1C] hover:bg-[#991B1B] active:translate-x-0.5 active:translate-y-0.5 text-white font-poster text-2xl uppercase tracking-wider py-4 px-6 border-3 border-[#18181B] shadow-poster cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isPending ? "Registrando Voluntário..." : "Enviar Meu Cadastro de Brigadista!"}
                  </button>

                  <div className="text-center font-poster text-sm text-[#713F12] uppercase tracking-wide">
                    Pela Defesa da Vida, da Floresta e da Nossa Gente!
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* RODAPÉ POPULAR */}
      <footer className="w-full bg-[#18181B] text-[#FAF4E6] border-t-4 border-[#18181B] mt-12 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex flex-col gap-1">
            <span className="font-poster text-2xl tracking-wide uppercase text-[#FEF08A]">
              Quero Ser Brigadista Comunitário
            </span>
            <span className="text-xs text-zinc-400">
              Articulação Comunitária Autônoma e Popular &bull; Santarém e Região Amazônica
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
