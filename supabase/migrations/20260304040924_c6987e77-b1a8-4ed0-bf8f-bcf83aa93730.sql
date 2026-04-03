
-- Tabela de controle para o pipeline automático de geração de aulas
CREATE TABLE public.aulas_geracao_fila (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  biblioteca_id integer NOT NULL,
  area text NOT NULL,
  tema text NOT NULL,
  pdf_url text,
  capa_url text,
  capa_area_url text,
  status text NOT NULL DEFAULT 'pendente',
  erro_msg text,
  materia_id integer,
  topicos_total integer DEFAULT 0,
  topicos_concluidos integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_aulas_geracao_fila_status ON public.aulas_geracao_fila(status);
CREATE INDEX idx_aulas_geracao_fila_area ON public.aulas_geracao_fila(area);
CREATE UNIQUE INDEX idx_aulas_geracao_fila_biblioteca_id ON public.aulas_geracao_fila(biblioteca_id);

-- Trigger updated_at
CREATE TRIGGER update_aulas_geracao_fila_updated_at
  BEFORE UPDATE ON public.aulas_geracao_fila
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.aulas_geracao_fila ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on aulas_geracao_fila"
  ON public.aulas_geracao_fila
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Service role full access on aulas_geracao_fila"
  ON public.aulas_geracao_fila
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Tabela de controle do cron (pausar/retomar)
CREATE TABLE public.aulas_geracao_config (
  id text PRIMARY KEY DEFAULT 'main',
  pausado boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.aulas_geracao_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage aulas_geracao_config"
  ON public.aulas_geracao_config
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Service role access on aulas_geracao_config"
  ON public.aulas_geracao_config
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Inserir config inicial
INSERT INTO public.aulas_geracao_config (id, pausado) VALUES ('main', false);
