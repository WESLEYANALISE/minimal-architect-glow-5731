
CREATE TABLE public.user_aulas_historico (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  tema text NOT NULL,
  area text,
  aula_id text,
  origem text DEFAULT 'reforco',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_aulas_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own lesson history"
ON public.user_aulas_historico FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lesson history"
ON public.user_aulas_historico FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lesson history"
ON public.user_aulas_historico FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_user_aulas_historico_user_id ON public.user_aulas_historico(user_id);
CREATE INDEX idx_user_aulas_historico_created_at ON public.user_aulas_historico(created_at DESC);
