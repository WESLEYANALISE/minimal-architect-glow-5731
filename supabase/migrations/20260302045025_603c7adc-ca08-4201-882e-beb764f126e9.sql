
-- Tabela para plano de assistir do JuriFlix
CREATE TABLE public.juriflix_plano_assistir (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  juriflix_id INTEGER NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, juriflix_id)
);

ALTER TABLE public.juriflix_plano_assistir ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plan" ON public.juriflix_plano_assistir FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own plan" ON public.juriflix_plano_assistir FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own plan" ON public.juriflix_plano_assistir FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own plan" ON public.juriflix_plano_assistir FOR DELETE USING (auth.uid() = user_id);

-- Tabela para histórico de visualizações do JuriFlix
CREATE TABLE public.juriflix_visualizacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  juriflix_id INTEGER NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.juriflix_visualizacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own history" ON public.juriflix_visualizacoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own history" ON public.juriflix_visualizacoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own history" ON public.juriflix_visualizacoes FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_juriflix_visualizacoes_user ON public.juriflix_visualizacoes(user_id, viewed_at DESC);
CREATE INDEX idx_juriflix_plano_user ON public.juriflix_plano_assistir(user_id, ordem);
