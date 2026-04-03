
-- Tabela de logs para auditoria dos webhooks recebidos da Cakto
CREATE TABLE public.cakto_webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event TEXT NOT NULL,
  order_id TEXT,
  customer_email TEXT,
  product_name TEXT,
  amount NUMERIC,
  payment_method TEXT,
  payload JSONB NOT NULL,
  processado BOOLEAN NOT NULL DEFAULT false,
  erro TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: apenas service_role acessa (webhook externo)
ALTER TABLE public.cakto_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Admin pode visualizar logs
CREATE POLICY "Admin pode ver logs cakto"
  ON public.cakto_webhook_logs
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Índices para consultas comuns
CREATE INDEX idx_cakto_logs_email ON public.cakto_webhook_logs(customer_email);
CREATE INDEX idx_cakto_logs_created ON public.cakto_webhook_logs(created_at DESC);
