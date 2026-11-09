export interface Brigadista {
  id: string;
  nome: string;
  dataNascimento: string; // YYYY-MM-DD
  email: string;
  telefone: string;
  estado: string; // UF
  cidade: string;
  zonaRural: boolean;
  bairro?: string;
  comunidade?: string;
  criadoEm: string;
}

export type NovoCadastroInput = Omit<Brigadista, "id" | "criadoEm">;

export function calcularIdade(dataNascimento: string): number {
  if (!dataNascimento) return 0;
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mesAtual = hoje.getMonth();
  const mesNasc = nascimento.getMonth();

  if (mesAtual < mesNasc || (mesAtual === mesNasc && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }

  return isNaN(idade) ? 0 : idade;
}

export function isMaiorDeIdade(dataNascimento: string): boolean {
  return calcularIdade(dataNascimento) >= 18;
}
