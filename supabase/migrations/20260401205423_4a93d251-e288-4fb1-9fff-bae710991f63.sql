CREATE TABLE public.videoaulas_artigos_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_tabela text NOT NULL,
  numero_artigo text NOT NULL,
  area text NOT NULL,
  video_id text NOT NULL,
  video_title text,
  video_channel text,
  video_thumbnail text,
  transcricao text,
  resumo text,
  flashcards jsonb,
  questoes jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(codigo_tabela, numero_artigo)
);

ALTER TABLE public.videoaulas_artigos_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública videoaulas cache"
  ON public.videoaulas_artigos_cache FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Insert e update via service role"
  ON public.videoaulas_artigos_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);