
CREATE TABLE public.vademecum_atualizacoes_pendentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela TEXT NOT NULL,
  numero_lei_nova TEXT,
  ementa TEXT,
  artigos_novos JSONB DEFAULT '[]'::jsonb,
  artigos_afetados JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'rejeitada')),
  total_alterados INTEGER DEFAULT 0,
  total_novos INTEGER DEFAULT 0,
  total_removidos INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  aprovada_em TIMESTAMP WITH TIME ZONE,
  aprovada_por TEXT
);

ALTER TABLE public.vademecum_atualizacoes_pendentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON public.vademecum_atualizacoes_pendentes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access" ON public.vademecum_atualizacoes_pendentes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_vademecum_atualizacoes_status ON public.vademecum_atualizacoes_pendentes(status);
CREATE INDEX idx_vademecum_atualizacoes_created ON public.vademecum_atualizacoes_pendentes(created_at DESC);
