
CREATE TABLE public.lacunas_progresso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lacuna_id BIGINT NOT NULL,
  area TEXT NOT NULL,
  tema TEXT NOT NULL,
  acertou BOOLEAN NOT NULL,
  estudado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lacuna_id)
);

ALTER TABLE public.lacunas_progresso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own progress" ON public.lacunas_progresso
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.lacunas_progresso
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.lacunas_progresso
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_lacunas_progresso_user ON public.lacunas_progresso(user_id);
CREATE INDEX idx_lacunas_progresso_area ON public.lacunas_progresso(user_id, area);
