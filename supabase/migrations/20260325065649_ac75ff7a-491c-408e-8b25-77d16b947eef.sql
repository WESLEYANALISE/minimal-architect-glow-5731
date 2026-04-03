
CREATE TABLE public.informativos_jurisprudencia (
  id BIGSERIAL PRIMARY KEY,
  tribunal TEXT NOT NULL CHECK (tribunal IN ('STF', 'STJ')),
  numero_edicao INT NOT NULL,
  data_publicacao DATE,
  titulo_edicao TEXT,
  tipo TEXT DEFAULT 'regular',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tribunal, numero_edicao)
);

CREATE TABLE public.informativos_notas (
  id BIGSERIAL PRIMARY KEY,
  informativo_id BIGINT REFERENCES public.informativos_jurisprudencia(id) ON DELETE CASCADE NOT NULL,
  orgao_julgador TEXT,
  ramo_direito TEXT,
  tema TEXT,
  destaque TEXT,
  inteiro_teor TEXT,
  processo TEXT,
  relator TEXT,
  data_julgamento DATE,
  link_processo TEXT,
  link_audio TEXT,
  link_video TEXT,
  ordem INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_informativos_tribunal ON public.informativos_jurisprudencia(tribunal);
CREATE INDEX idx_informativos_numero ON public.informativos_jurisprudencia(numero_edicao DESC);
CREATE INDEX idx_notas_informativo ON public.informativos_notas(informativo_id);
CREATE INDEX idx_notas_ramo ON public.informativos_notas(ramo_direito);

ALTER TABLE public.informativos_jurisprudencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.informativos_notas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read informativos" ON public.informativos_jurisprudencia FOR SELECT USING (true);
CREATE POLICY "Allow public read notas" ON public.informativos_notas FOR SELECT USING (true);
