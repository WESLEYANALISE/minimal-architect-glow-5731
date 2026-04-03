
-- Add new columns to onboarding_quiz_respostas
ALTER TABLE public.onboarding_quiz_respostas
  ADD COLUMN IF NOT EXISTS concurso_alvo text,
  ADD COLUMN IF NOT EXISTS materia_dificil text,
  ADD COLUMN IF NOT EXISTS area_atuacao text,
  ADD COLUMN IF NOT EXISTS ferramentas_preferidas text[],
  ADD COLUMN IF NOT EXISTS confirmacao_18 boolean DEFAULT false;
