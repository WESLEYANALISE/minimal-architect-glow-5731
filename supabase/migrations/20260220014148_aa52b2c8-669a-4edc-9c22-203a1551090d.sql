
CREATE TABLE IF NOT EXISTS public.onboarding_quiz_respostas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  intencao text,
  faixa_etaria text,
  forma_estudo text,
  necessidade_app text,
  frequencia_estudo text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.onboarding_quiz_respostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own quiz" ON public.onboarding_quiz_respostas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can read all quiz" ON public.onboarding_quiz_respostas
  FOR SELECT USING (true);
