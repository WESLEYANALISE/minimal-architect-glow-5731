ALTER TABLE public.filmes_do_dia ADD COLUMN imagens_cenas text[] DEFAULT '{}';

COMMENT ON COLUMN public.filmes_do_dia.imagens_cenas IS 'URLs de imagens/cenas do filme do TMDB';