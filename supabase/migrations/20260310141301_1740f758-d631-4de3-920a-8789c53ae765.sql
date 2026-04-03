
CREATE TABLE IF NOT EXISTS public.checkout_recovery_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_type text,
  telefone text,
  fields_filled jsonb DEFAULT '[]'::jsonb,
  fields_count integer DEFAULT 0,
  mensagem_tipo text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index para deduplicação rápida (buscar por user_id + data recente)
CREATE INDEX IF NOT EXISTS idx_checkout_recovery_user_date 
  ON public.checkout_recovery_log (user_id, created_at DESC);

-- RLS
ALTER TABLE public.checkout_recovery_log ENABLE ROW LEVEL SECURITY;

-- Apenas service_role pode inserir/ler (edge function)
CREATE POLICY "Service role full access on checkout_recovery_log"
  ON public.checkout_recovery_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
