
-- Tabela para histórico do jogo Invasores Jurídicos
CREATE TABLE public.invasores_historico (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  codigo_slug TEXT NOT NULL,
  pontuacao INTEGER DEFAULT 0,
  nivel_maximo INTEGER DEFAULT 1,
  fantasmas_destruidos INTEGER DEFAULT 0,
  artigos_cobertos TEXT[] DEFAULT '{}',
  power_ups_usados INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, codigo_slug)
);

ALTER TABLE public.invasores_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invasores data"
  ON public.invasores_historico FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invasores data"
  ON public.invasores_historico FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invasores data"
  ON public.invasores_historico FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_invasores_historico_updated_at
  BEFORE UPDATE ON public.invasores_historico
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
