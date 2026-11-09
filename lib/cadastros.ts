import fs from "node:fs/promises";
import path from "node:path";
import { Brigadista, NovoCadastroInput } from "./types";

export * from "./types";

const DATA_FILE = path.join(process.cwd(), "data", "cadastros.json");

const SEED_DATA: Brigadista[] = [
  {
    id: "brg-001",
    nome: "Raimundo Nonato de Souza",
    dataNascimento: "1988-05-14",
    email: "raimundo.defesa@gmail.com",
    telefone: "(93) 99122-3344",
    estado: "PA",
    cidade: "Santarém",
    zonaRural: true,
    comunidade: "São Sebastião",
    criadoEm: "2026-11-01T09:30:00.000Z",
  },
  {
    id: "brg-002",
    nome: "Marisa Pinheiro Tapajós",
    dataNascimento: "1995-10-22",
    email: "marisa.tapajos@hotmail.com",
    telefone: "(93) 98411-5566",
    estado: "PA",
    cidade: "Santarém",
    zonaRural: false,
    bairro: "Santarenzinho",
    criadoEm: "2026-11-02T14:15:00.000Z",
  },
  {
    id: "brg-003",
    nome: "Jonas Silva de Oliveira",
    dataNascimento: "2002-03-10",
    email: "jonas.oliveira.floresta@gmail.com",
    telefone: "(93) 99233-7788",
    estado: "PA",
    cidade: "Santarém",
    zonaRural: true,
    comunidade: "Alter do Chão",
    criadoEm: "2026-11-03T11:00:00.000Z",
  },
  {
    id: "brg-004",
    nome: "Clara Beatriz Ferreira",
    dataNascimento: "2009-08-19", // 17 anos - menor de 18
    email: "clara.beatriz.ambiental@outlook.com",
    telefone: "(93) 99188-9900",
    estado: "PA",
    cidade: "Santarém",
    zonaRural: false,
    bairro: "Centro",
    criadoEm: "2026-11-04T16:20:00.000Z",
  },
  {
    id: "brg-005",
    nome: "Francisco Célio Barroso",
    dataNascimento: "1980-12-05",
    email: "barroso.celio@yahoo.com.br",
    telefone: "(93) 98100-2233",
    estado: "PA",
    cidade: "Belterra",
    zonaRural: true,
    comunidade: "Piquiatuba (FLONA)",
    criadoEm: "2026-11-05T08:45:00.000Z",
  },
  {
    id: "brg-006",
    nome: "Larissa Menezes Santos",
    dataNascimento: "2001-07-28",
    email: "larissa.menezes@gmail.com",
    telefone: "(93) 99344-1122",
    estado: "PA",
    cidade: "Belterra",
    zonaRural: false,
    bairro: "Bela Vista",
    criadoEm: "2026-11-06T10:10:00.000Z",
  },
  {
    id: "brg-007",
    nome: "Antônio Carlos Albuquerque",
    dataNascimento: "1976-04-03",
    email: "antonio.albuquerque@gmail.com",
    telefone: "(92) 99877-4455",
    estado: "AM",
    cidade: "Manaus",
    zonaRural: false,
    bairro: "Ponta Negra",
    criadoEm: "2026-11-07T13:40:00.000Z",
  },
  {
    id: "brg-008",
    nome: "Danilo Castro dos Anjos",
    dataNascimento: "2010-01-15", // Menor de 18 anos
    email: "danilo.juventude.clima@gmail.com",
    telefone: "(93) 99177-8899",
    estado: "PA",
    cidade: "Santarém",
    zonaRural: true,
    comunidade: "São Sebastião",
    criadoEm: "2026-11-07T17:05:00.000Z",
  },
];

async function initDataFile(): Promise<void> {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(SEED_DATA, null, 2), "utf-8");
  }
}

export async function listarCadastros(): Promise<Brigadista[]> {
  await initDataFile();
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      return [];
    }
    return data.sort(
      (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
    );
  } catch (error) {
    console.error("Erro ao ler cadastros:", error);
    return [];
  }
}

export async function salvarCadastro(input: NovoCadastroInput): Promise<Brigadista> {
  await initDataFile();
  const cadastros = await listarCadastros();

  const novo: Brigadista = {
    ...input,
    id: `brg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    criadoEm: new Date().toISOString(),
  };

  cadastros.unshift(novo);
  await fs.writeFile(DATA_FILE, JSON.stringify(cadastros, null, 2), "utf-8");
  return novo;
}
