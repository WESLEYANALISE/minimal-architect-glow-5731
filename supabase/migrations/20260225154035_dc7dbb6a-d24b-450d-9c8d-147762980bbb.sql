
-- Tabela para registrar todas as tentativas de pagamento (aprovadas e rejeitadas)
CREATE TABLE public.payment_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT,
  plan_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'credit_card',
  mp_payment_id TEXT,
  mp_status TEXT,
  mp_status_detail TEXT,
  error_message TEXT,
  installments INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;

-- Apenas service_role pode inserir (via edge function)
CREATE POLICY "Service role can manage payment_attempts"
ON public.payment_attempts
FOR ALL
USING (false)
WITH CHECK (false);

-- Admin pode visualizar
CREATE POLICY "Authenticated users can view payment_attempts"
ON public.payment_attempts
FOR SELECT
TO authenticated
USING (true);

-- Index para consultas por user_id e data
CREATE INDEX idx_payment_attempts_user_id ON public.payment_attempts (user_id);
CREATE INDEX idx_payment_attempts_created_at ON public.payment_attempts (created_at DESC);
