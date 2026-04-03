
-- Tabela dicas_do_dia
CREATE TABLE public.dicas_do_dia (
  id SERIAL PRIMARY KEY,
  data DATE NOT NULL UNIQUE,
  livro_id BIGINT NOT NULL,
  biblioteca TEXT NOT NULL,
  livro_titulo TEXT NOT NULL,
  livro_autor TEXT,
  livro_capa TEXT,
  livro_sobre TEXT,
  porque_ler TEXT NOT NULL DEFAULT '',
  frase_dia TEXT,
  dica_estudo TEXT,
  area_livro TEXT,
  audio_url TEXT,
  audio_duracao_segundos INTEGER,
  status TEXT NOT NULL DEFAULT 'gerando',
  liberado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: somente admin pode ler
ALTER TABLE public.dicas_do_dia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can select dicas_do_dia"
  ON public.dicas_do_dia
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Storage bucket público para áudios
INSERT INTO storage.buckets (id, name, public)
VALUES ('dicas-audio', 'dicas-audio', true);

-- Qualquer um pode ler os áudios (bucket público)
CREATE POLICY "Public read dicas-audio"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'dicas-audio');
