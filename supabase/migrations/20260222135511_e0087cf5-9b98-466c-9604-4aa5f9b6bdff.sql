
-- Tabela filmes_do_dia para Recomendação de Filmes
CREATE TABLE public.filmes_do_dia (
  id SERIAL PRIMARY KEY,
  data DATE NOT NULL UNIQUE,
  tmdb_id INTEGER,
  titulo TEXT NOT NULL,
  titulo_original TEXT,
  sinopse TEXT,
  poster_path TEXT,
  backdrop_path TEXT,
  trailer_url TEXT,
  elenco JSONB,
  diretor TEXT,
  generos TEXT[],
  duracao INTEGER,
  ano INTEGER,
  nota_tmdb NUMERIC,
  porque_assistir TEXT,
  beneficios_juridicos TEXT,
  frase_dia TEXT,
  audio_url TEXT,
  audio_duracao_segundos INTEGER,
  status TEXT NOT NULL DEFAULT 'gerando',
  liberado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.filmes_do_dia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura publica filmes prontos"
  ON public.filmes_do_dia
  FOR SELECT
  USING (status = 'pronto');

-- Index para busca por data
CREATE INDEX idx_filmes_do_dia_data ON public.filmes_do_dia (data);
CREATE INDEX idx_filmes_do_dia_status ON public.filmes_do_dia (status);
