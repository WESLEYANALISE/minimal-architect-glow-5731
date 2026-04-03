
-- ============================================
-- 1. Tabela de Revisões Espaçadas (SM-2)
-- ============================================
CREATE TABLE public.flashcard_revisoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flashcard_id INTEGER NOT NULL,
  area TEXT NOT NULL,
  tema TEXT,
  -- SM-2 algorithm fields
  fator_facilidade NUMERIC(4,2) NOT NULL DEFAULT 2.50,
  intervalo_dias INTEGER NOT NULL DEFAULT 0,
  repeticoes INTEGER NOT NULL DEFAULT 0,
  proxima_revisao DATE NOT NULL DEFAULT CURRENT_DATE,
  ultima_revisao TIMESTAMPTZ,
  -- Stats
  total_acertos INTEGER NOT NULL DEFAULT 0,
  total_erros INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, flashcard_id)
);

-- RLS
ALTER TABLE public.flashcard_revisoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own reviews"
  ON public.flashcard_revisoes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_flashcard_revisoes_updated_at
  BEFORE UPDATE ON public.flashcard_revisoes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Index for fast lookups
CREATE INDEX idx_flashcard_revisoes_user_proxima 
  ON public.flashcard_revisoes(user_id, proxima_revisao);
CREATE INDEX idx_flashcard_revisoes_user_area 
  ON public.flashcard_revisoes(user_id, area);

-- ============================================
-- 2. Tabela de Prompts Versionados
-- ============================================
CREATE TABLE public.prompts_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL,
  nome TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  versao INTEGER NOT NULL DEFAULT 1,
  ativo BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(categoria, nome, versao)
);

ALTER TABLE public.prompts_templates ENABLE ROW LEVEL SECURITY;

-- Public read (Edge Functions need to read)
CREATE POLICY "Anyone can read active prompts"
  ON public.prompts_templates
  FOR SELECT
  TO anon, authenticated
  USING (ativo = true);

CREATE TRIGGER update_prompts_templates_updated_at
  BEFORE UPDATE ON public.prompts_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_prompts_templates_lookup 
  ON public.prompts_templates(categoria, nome, ativo);

-- ============================================
-- 3. RPC para buscar cards pendentes de revisão
-- ============================================
CREATE OR REPLACE FUNCTION public.get_flashcards_para_revisao(
  p_user_id UUID,
  p_area TEXT DEFAULT NULL,
  p_limite INTEGER DEFAULT 50
)
RETURNS TABLE(
  flashcard_id INTEGER,
  area TEXT,
  tema TEXT,
  fator_facilidade NUMERIC,
  intervalo_dias INTEGER,
  repeticoes INTEGER,
  dias_atrasado INTEGER
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    fr.flashcard_id,
    fr.area,
    fr.tema,
    fr.fator_facilidade,
    fr.intervalo_dias,
    fr.repeticoes,
    (CURRENT_DATE - fr.proxima_revisao)::INTEGER as dias_atrasado
  FROM public.flashcard_revisoes fr
  WHERE fr.user_id = p_user_id
    AND fr.proxima_revisao <= CURRENT_DATE
    AND (p_area IS NULL OR fr.area = p_area)
  ORDER BY fr.proxima_revisao ASC, fr.fator_facilidade ASC
  LIMIT p_limite;
$$;
