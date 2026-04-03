
-- Fila unificada para geração de todo conteúdo
CREATE TABLE public.geracao_unificada_fila (
  id BIGSERIAL PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('cornell', 'feynman', 'flashcards', 'questoes')),
  area TEXT NOT NULL,
  tema TEXT NOT NULL,
  subtema TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'gerando', 'concluido', 'erro')),
  erro TEXT,
  itens_gerados INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint using a generated column for subtema
ALTER TABLE public.geracao_unificada_fila 
  ADD COLUMN subtema_key TEXT GENERATED ALWAYS AS (COALESCE(subtema, '')) STORED;

ALTER TABLE public.geracao_unificada_fila
  ADD CONSTRAINT uq_geracao_unificada UNIQUE(tipo, area, tema, subtema_key);

-- Config de pausa para o pipeline unificado
CREATE TABLE public.geracao_unificada_config (
  id TEXT PRIMARY KEY DEFAULT 'main',
  pausado BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.geracao_unificada_config (id, pausado) VALUES ('main', false);

-- Indexes para performance
CREATE INDEX idx_geracao_unificada_status ON public.geracao_unificada_fila(status);
CREATE INDEX idx_geracao_unificada_tipo_status ON public.geracao_unificada_fila(tipo, status);

-- Trigger updated_at
CREATE TRIGGER update_geracao_unificada_fila_updated_at
  BEFORE UPDATE ON public.geracao_unificada_fila
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_geracao_unificada_config_updated_at
  BEFORE UPDATE ON public.geracao_unificada_config
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.geracao_unificada_fila ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geracao_unificada_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read geracao_unificada_fila"
  ON public.geracao_unificada_fila FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read geracao_unificada_config"
  ON public.geracao_unificada_config FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated update geracao_unificada_config"
  ON public.geracao_unificada_config FOR UPDATE TO authenticated USING (true);
