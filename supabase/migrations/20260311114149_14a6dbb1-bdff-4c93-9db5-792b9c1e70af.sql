
-- Tabela para explicações diárias de artigos (estilo TikTok)
CREATE TABLE public.explicacoes_artigos_diarias (
  id SERIAL PRIMARY KEY,
  numero_artigo TEXT NOT NULL,
  codigo TEXT NOT NULL DEFAULT 'cp',
  titulo TEXT NOT NULL,
  texto_artigo TEXT NOT NULL,
  explicacao_completa TEXT NOT NULL DEFAULT '',
  segmentos JSONB NOT NULL DEFAULT '[]',
  audio_url TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  progresso_geracao INT DEFAULT 0,
  data_publicacao DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(numero_artigo, codigo)
);

-- RLS
ALTER TABLE public.explicacoes_artigos_diarias ENABLE ROW LEVEL SECURITY;

-- Leitura pública
CREATE POLICY "Leitura publica explicacoes artigos"
  ON public.explicacoes_artigos_diarias
  FOR SELECT
  TO authenticated
  USING (true);

-- Trigger updated_at
CREATE TRIGGER update_explicacoes_artigos_updated_at
  BEFORE UPDATE ON public.explicacoes_artigos_diarias
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Storage bucket para imagens das explicações
INSERT INTO storage.buckets (id, name, public)
VALUES ('explicacoes-artigos', 'explicacoes-artigos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy para leitura pública do bucket
CREATE POLICY "Public read explicacoes-artigos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'explicacoes-artigos');

-- Policy para upload (service role via edge function)
CREATE POLICY "Service upload explicacoes-artigos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'explicacoes-artigos');
