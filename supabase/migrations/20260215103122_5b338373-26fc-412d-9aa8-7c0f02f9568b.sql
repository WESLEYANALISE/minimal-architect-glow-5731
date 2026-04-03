
-- Tabela para cachear palavras geradas por matéria/nível
CREATE TABLE public.gamificacao_palavras_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  materia TEXT NOT NULL,
  nivel INTEGER NOT NULL,
  palavras JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(materia, nivel)
);

ALTER TABLE public.gamificacao_palavras_cache ENABLE ROW LEVEL SECURITY;

-- Leitura pública (todos podem ler as palavras)
CREATE POLICY "Leitura pública das palavras" ON public.gamificacao_palavras_cache
  FOR SELECT USING (true);

-- Apenas service_role insere (via edge function)
CREATE POLICY "Insert via service role" ON public.gamificacao_palavras_cache
  FOR INSERT WITH CHECK (true);
