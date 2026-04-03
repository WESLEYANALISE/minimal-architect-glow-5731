
CREATE TABLE public.aulas_em_tela (
  id SERIAL PRIMARY KEY,
  area TEXT NOT NULL,
  modulo INTEGER NOT NULL,
  aula INTEGER NOT NULL,
  tema TEXT,
  assunto TEXT,
  capa TEXT,
  video TEXT,
  conteudo TEXT,
  material TEXT,
  capa_modulo TEXT,
  capa_area TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT aulas_em_tela_unique UNIQUE (area, modulo, aula)
);

ALTER TABLE public.aulas_em_tela ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso público de leitura às aulas em tela"
  ON public.aulas_em_tela
  FOR SELECT
  USING (true);
