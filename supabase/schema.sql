-- Criação da tabela de cadastros de voluntários brigadistas
CREATE TABLE IF NOT EXISTS public.cadastros (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  data_nascimento TEXT NOT NULL,
  email TEXT,
  telefone TEXT NOT NULL,
  estado TEXT NOT NULL,
  cidade TEXT NOT NULL,
  zona_rural BOOLEAN NOT NULL DEFAULT false,
  bairro TEXT,
  comunidade TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Ativação de Row Level Security (RLS)
ALTER TABLE public.cadastros ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Permitir leitura pública de cadastros"
ON public.cadastros FOR SELECT
USING (true);

CREATE POLICY "Permitir inserção de cadastros"
ON public.cadastros FOR INSERT
WITH CHECK (true);

-- ==============================================================================
-- TABELA DE ADMINISTRADORES
-- Acesso restrito: NÃO PERMITE cadastro pelo site.
-- Inserções devem ser feitas MANUALMENTE diretamente no banco de dados.
-- ==============================================================================

-- Extensão necessária para funções de criptografia no PostgreSQL
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Criação da tabela de admins
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  senha_hash TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Índice único insensível a maiúsculas/minúsculas para e-mail
CREATE UNIQUE INDEX IF NOT EXISTS admins_email_lower_idx ON public.admins (LOWER(email));

-- Ativação de Row Level Security (RLS)
-- Sem políticas públicas de SELECT/INSERT/UPDATE/DELETE.
-- O acesso à tabela é feito estritamente pelo backend com a chave de serviço (service_role).
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- EXEMPLOS DE INSERÇÃO MANUAL DE ADMINISTRADOR DIRETAMENTE NO BANCO:
-- ==============================================================================
--
-- Opção A (Recomendada): Senha criptografada com Blowfish/Bcrypt via pgcrypto
-- INSERT INTO public.admins (nome, email, senha_hash)
-- VALUES (
--   'Administrador Geral',
--   'admin@brigadas.org',
--   crypt('sua_senha_aqui', gen_salt('bf'))
-- );
--
-- Opção B: Inserção de texto plano (no primeiro login, o sistema atualiza
-- automaticamente para hash bcrypt forte):
-- INSERT INTO public.admins (nome, email, senha_hash)
-- VALUES (
--   'Administrador Geral',
--   'admin@brigadas.org',
--   'sua_senha_aqui'
-- );

