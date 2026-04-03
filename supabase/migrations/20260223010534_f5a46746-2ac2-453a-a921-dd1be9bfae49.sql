
CREATE TABLE public.user_anotacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL DEFAULT '',
  conteudo TEXT NOT NULL DEFAULT '',
  cor TEXT DEFAULT '#FEF7CD',
  importante BOOLEAN NOT NULL DEFAULT false,
  data_referencia DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_anotacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notes" ON public.user_anotacoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own notes" ON public.user_anotacoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notes" ON public.user_anotacoes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes" ON public.user_anotacoes FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_anotacoes_updated_at
BEFORE UPDATE ON public.user_anotacoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_user_anotacoes_user_date ON public.user_anotacoes (user_id, data_referencia);
