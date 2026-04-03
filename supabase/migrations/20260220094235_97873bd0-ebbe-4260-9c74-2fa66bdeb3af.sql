
-- Adicionar novas colunas ao onboarding_quiz_respostas
ALTER TABLE public.onboarding_quiz_respostas 
  ADD COLUMN IF NOT EXISTS semestre text,
  ADD COLUMN IF NOT EXISTS fase_oab text,
  ADD COLUMN IF NOT EXISTS dificuldade text;

-- Dropar o trigger que causa envio duplo de notificação
-- (A notificação agora é feita SOMENTE via código no handleFinish)
DROP TRIGGER IF EXISTS trigger_notify_admin_new_signup ON public.profiles;
