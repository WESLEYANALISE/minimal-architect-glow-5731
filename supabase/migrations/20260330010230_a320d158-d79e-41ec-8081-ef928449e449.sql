
CREATE TABLE public.pratica_artigos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_tabela text NOT NULL,
  numero_artigo text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('flashcard_conceito', 'flashcard_lacuna', 'flashcard_correspondencia', 'questao_alternativa', 'questao_sim_nao', 'questao_caso_pratico')),
  conteudo jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (codigo_tabela, numero_artigo, tipo)
);

ALTER TABLE public.pratica_artigos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.pratica_artigos
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Service role insert/update" ON public.pratica_artigos
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER update_pratica_artigos_updated_at
  BEFORE UPDATE ON public.pratica_artigos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
