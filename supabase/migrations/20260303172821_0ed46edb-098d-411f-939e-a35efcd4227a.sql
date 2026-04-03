
-- Add total_abertos column to track notification opens
ALTER TABLE public.notificacoes_push_enviadas ADD COLUMN IF NOT EXISTS total_abertos INTEGER DEFAULT 0;
