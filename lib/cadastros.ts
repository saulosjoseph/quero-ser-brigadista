import { supabase } from "./supabase";
import { Brigadista, NovoCadastroInput } from "./types";

export * from "./types";

interface CadastroRow {
  id: string;
  nome: string;
  data_nascimento: string;
  email: string | null;
  telefone: string;
  estado: string;
  cidade: string;
  zona_rural: boolean;
  bairro: string | null;
  comunidade: string | null;
  consentimento_lgpd?: boolean;
  criado_em: string;
}

function rowParaBrigadista(row: CadastroRow): Brigadista {
  return {
    id: row.id,
    nome: row.nome,
    dataNascimento: row.data_nascimento,
    email: row.email || "",
    telefone: row.telefone,
    estado: row.estado,
    cidade: row.cidade,
    zonaRural: Boolean(row.zona_rural),
    bairro: row.bairro || undefined,
    comunidade: row.comunidade || undefined,
    consentimentoLgpd: row.consentimento_lgpd ?? true,
    criadoEm: row.criado_em,
  };
}

export async function listarCadastros(): Promise<Brigadista[]> {
  const { data, error } = await supabase
    .from("cadastros")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("Erro ao listar cadastros no Supabase:", error);
    throw new Error(`Falha ao carregar cadastros do Supabase: ${error.message}`);
  }

  return ((data as CadastroRow[]) || []).map(rowParaBrigadista);
}

export async function salvarCadastro(input: NovoCadastroInput): Promise<Brigadista> {
  const novoId = `brg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const criadoEm = new Date().toISOString();

  const baseRegistro = {
    id: novoId,
    nome: input.nome.trim(),
    data_nascimento: input.dataNascimento.trim(),
    email: input.email && input.email.trim() ? input.email.trim().toLowerCase() : null,
    telefone: input.telefone.trim(),
    estado: input.estado.trim().toUpperCase(),
    cidade: input.cidade.trim(),
    zona_rural: Boolean(input.zonaRural),
    bairro: !input.zonaRural && input.bairro ? input.bairro.trim() : null,
    comunidade: input.zonaRural && input.comunidade ? input.comunidade.trim() : null,
    criado_em: criadoEm,
  };

  const novoRegistro = {
    ...baseRegistro,
    consentimento_lgpd: Boolean(input.consentimentoLgpd),
  };

  let { data, error } = await supabase
    .from("cadastros")
    .insert([novoRegistro])
    .select()
    .single();

  // Fallback seguro caso a migração da coluna consentimento_lgpd ainda não tenha sido aplicada no banco
  if (error && error.message?.includes("consentimento_lgpd")) {
    const retry = await supabase
      .from("cadastros")
      .insert([baseRegistro])
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error("Erro ao salvar cadastro no Supabase:", error);
    throw new Error(`Falha ao salvar cadastro no Supabase: ${error.message}`);
  }

  return rowParaBrigadista(data as CadastroRow);
}

export async function excluirCadastro(id: string): Promise<boolean> {
  const { error } = await supabase.from("cadastros").delete().eq("id", id);

  if (error) {
    console.error(`Erro ao excluir cadastro ${id} no Supabase:`, error);
    throw new Error(`Falha ao excluir cadastro no Supabase: ${error.message}`);
  }

  return true;
}

