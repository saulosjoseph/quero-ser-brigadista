import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { supabase } from "./supabase";

export const ADMIN_COOKIE_NAME = "brigada_admin_session";

export interface AdminPayload {
  id: string;
  nome: string;
  email: string;
  exp: number;
}

export interface AdminUser {
  id: string;
  nome: string;
  email: string;
  ativo?: boolean;
}

function getSecretKey(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SUPABASE_JWT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "segredo-padrao-sessao-brigadas-2026-fallback"
  );
}

/**
 * Cria um token assinado com HMAC-SHA256 contendo os dados do admin e tempo de expiração.
 */
export function criarTokenSessao(admin: { id: string; nome: string; email: string }): string {
  const payload: AdminPayload = {
    id: admin.id,
    nome: admin.nome,
    email: admin.email.toLowerCase(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 dias de validade
  };

  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const hmac = crypto
    .createHmac("sha256", getSecretKey())
    .update(data)
    .digest("base64url");

  return `${data}.${hmac}`;
}

/**
 * Valida a assinatura e expiração de um token de sessão.
 */
export function validarTokenSessao(token: string | undefined | null): AdminPayload | null {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }

  const [data, signature] = token.split(".");
  if (!data || !signature) {
    return null;
  }

  try {
    const expectedHmac = crypto
      .createHmac("sha256", getSecretKey())
      .update(data)
      .digest("base64url");

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedHmac);

    if (sigBuffer.length !== expectedBuffer.length) {
      return null;
    }

    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString("utf-8")
    ) as AdminPayload;

    if (!payload.exp || Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Autentica o administrador verificando se ele existe na tabela 'admins' do banco de dados
 * e se a senha confere (com suporte a hash bcrypt, sha256 ou texto puro inserido manualmente).
 */
export async function autenticarAdmin(
  email: string,
  senha: string
): Promise<{ id: string; nome: string; email: string } | null> {
  if (!email || !senha || typeof email !== "string" || typeof senha !== "string") {
    return null;
  }

  const emailLimpo = email.trim().toLowerCase();

  // Consulta na tabela de admins
  const { data, error } = await supabase
    .from("admins")
    .select("id, nome, email, senha_hash, ativo")
    .ilike("email", emailLimpo)
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  const admin = data[0] as {
    id: string;
    nome: string;
    email: string;
    senha_hash?: string;
    senha?: string;
    ativo?: boolean;
  };

  // Se o usuário estiver inativo no banco, nega acesso
  if (admin.ativo === false) {
    return null;
  }

  const senhaArmazenada = admin.senha_hash || admin.senha || "";
  if (!senhaArmazenada) {
    return null;
  }

  let valida = false;
  let precisaAtualizarParaBcrypt = false;

  // 1. Tentar comparar como hash bcrypt ($2a$, $2b$, $2y$)
  if (
    senhaArmazenada.startsWith("$2a$") ||
    senhaArmazenada.startsWith("$2b$") ||
    senhaArmazenada.startsWith("$2y$")
  ) {
    try {
      valida = bcrypt.compareSync(senha, senhaArmazenada);
    } catch {
      valida = false;
    }
  } else {
    // 2. Se o administrador foi inserido manualmente com senha em texto puro diretamente no banco
    if (senhaArmazenada === senha) {
      valida = true;
      precisaAtualizarParaBcrypt = true;
    } else {
      // 3. Fallback para caso tenha sido inserido com hash SHA-256
      const sha256Digitada = crypto.createHash("sha256").update(senha).digest("hex");
      if (senhaArmazenada.toLowerCase() === sha256Digitada.toLowerCase()) {
        valida = true;
        precisaAtualizarParaBcrypt = true;
      }
    }
  }

  if (!valida) {
    return null;
  }

  // Se a senha foi inserida em texto puro ou SHA-256, atualiza automaticamente para hash bcrypt forte
  if (precisaAtualizarParaBcrypt) {
    try {
      const novoHash = bcrypt.hashSync(senha, 10);
      await supabase
        .from("admins")
        .update({
          senha_hash: novoHash,
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", admin.id);
    } catch (err) {
      console.warn("[Admin Auth] Não foi possível atualizar hash no banco:", err);
    }
  }

  return {
    id: admin.id,
    nome: admin.nome,
    email: admin.email,
  };
}

/**
 * Verifica se um admin ID ainda existe e está ativo na tabela do banco.
 */
export async function verificarAdminAtivoNoBanco(adminId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("admins")
    .select("id, ativo")
    .eq("id", adminId)
    .limit(1);

  if (error || !data || data.length === 0) {
    return false;
  }

  return data[0].ativo !== false;
}

/**
 * Extrai o token do cabeçalho Cookie de uma Request.
 */
export function extrairTokenDoHeaderCookie(
  cookieHeader: string | null | undefined
): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE_NAME}=([^;]+)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Lê e valida o cookie de sessão do administrador atual.
 * Aceita opcionalmente um objeto Request (ideal para Route Handlers).
 */
export async function obterSessaoAdmin(
  request?: Request
): Promise<AdminPayload | null> {
  if (request) {
    const cookieHeader = request.headers.get("cookie");
    const token = extrairTokenDoHeaderCookie(cookieHeader);
    return validarTokenSessao(token);
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    return validarTokenSessao(token);
  } catch {
    return null;
  }
}

/**
 * Cria a sessão e grava o cookie HTTP-only seguro.
 */
export async function criarSessaoAdmin(admin: {
  id: string;
  nome: string;
  email: string;
}): Promise<string> {
  const token = criarTokenSessao(admin);
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 dias
  });

  return token;
}

/**
 * Remove o cookie de sessão do administrador.
 */
export async function destruirSessaoAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}
