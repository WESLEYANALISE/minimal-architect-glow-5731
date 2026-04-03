
ALTER TABLE public.leis_push_2025 
ADD COLUMN IF NOT EXISTS explicacao_lei TEXT,
ADD COLUMN IF NOT EXISTS explicacoes_artigos JSONB,
ADD COLUMN IF NOT EXISTS capa_explicacao_url TEXT;
