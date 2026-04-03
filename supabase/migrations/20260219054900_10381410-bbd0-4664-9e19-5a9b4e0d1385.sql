
-- Tabela para planos de estudo de questões
CREATE TABLE public.user_questoes_plano (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  area text NOT NULL,
  temas jsonb NOT NULL DEFAULT '[]'::jsonb,
  duracao integer NOT NULL DEFAULT 7,
  meta_diaria integer NOT NULL DEFAULT 10,
  data_inicio date NOT NULL DEFAULT CURRENT_DATE,
  cronograma jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_questoes_plano ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own planos" ON public.user_questoes_plano FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own planos" ON public.user_questoes_plano FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own planos" ON public.user_questoes_plano FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own planos" ON public.user_questoes_plano FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_questoes_plano_updated_at
  BEFORE UPDATE ON public.user_questoes_plano
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela para desafio diário
CREATE TABLE public.user_questoes_desafio (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  meta_diaria integer DEFAULT 10,
  area text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_questoes_desafio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own desafio" ON public.user_questoes_desafio FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own desafio" ON public.user_questoes_desafio FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own desafio" ON public.user_questoes_desafio FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own desafio" ON public.user_questoes_desafio FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_questoes_desafio_updated_at
  BEFORE UPDATE ON public.user_questoes_desafio
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
