
CREATE TABLE public.artigo_ai_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tabela_nome TEXT NOT NULL,
  artigo_numero TEXT NOT NULL,
  modo TEXT NOT NULL DEFAULT 'grifo_magico',
  conteudo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT artigo_ai_cache_unique UNIQUE (tabela_nome, artigo_numero, modo)
);

ALTER TABLE public.artigo_ai_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cache" ON public.artigo_ai_cache
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert cache" ON public.artigo_ai_cache
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update cache" ON public.artigo_ai_cache
  FOR UPDATE USING (true);
