
-- Tabela de cache para notícias legislativas da Câmara dos Deputados
CREATE TABLE public.noticias_legislativas_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text,
  link text UNIQUE NOT NULL,
  imagem text,
  imagem_webp text,
  fonte text DEFAULT 'Câmara dos Deputados',
  categoria text,
  data_publicacao timestamp with time zone,
  conteudo_formatado text,
  conteudo_completo text,
  analise_ia text,
  termos_json jsonb DEFAULT '[]'::jsonb,
  relevancia integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS
ALTER TABLE public.noticias_legislativas_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública noticias legislativas"
  ON public.noticias_legislativas_cache
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Trigger de updated_at
CREATE TRIGGER update_noticias_legislativas_cache_updated_at
  BEFORE UPDATE ON public.noticias_legislativas_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_noticias_cache_updated_at();

-- Índices
CREATE INDEX idx_noticias_legislativas_data ON public.noticias_legislativas_cache (data_publicacao DESC);
CREATE INDEX idx_noticias_legislativas_link ON public.noticias_legislativas_cache (link);
