
CREATE TABLE public.explicacao_leis_dia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  explicacao_texto TEXT,
  lei_original_resumo TEXT,
  capa_url TEXT,
  leis_ids UUID[] DEFAULT '{}',
  total_leis INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'gerando', 'concluido', 'erro')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.explicacao_leis_dia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública explicacao_leis_dia"
  ON public.explicacao_leis_dia FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE INDEX idx_explicacao_leis_dia_data ON public.explicacao_leis_dia(data DESC);
