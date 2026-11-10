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
