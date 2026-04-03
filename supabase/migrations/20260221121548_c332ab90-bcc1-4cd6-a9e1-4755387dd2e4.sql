
CREATE TABLE public.aulas_em_tela_conteudo_cache (
  id SERIAL PRIMARY KEY,
  aula_id INTEGER NOT NULL UNIQUE,
  flashcards JSONB,
  questoes JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.aulas_em_tela_conteudo_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura publica do cache" ON public.aulas_em_tela_conteudo_cache
  FOR SELECT USING (true);

CREATE POLICY "Usuarios autenticados podem inserir/atualizar cache" ON public.aulas_em_tela_conteudo_cache
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados podem atualizar cache" ON public.aulas_em_tela_conteudo_cache
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_aulas_em_tela_conteudo_cache_updated_at
  BEFORE UPDATE ON public.aulas_em_tela_conteudo_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
