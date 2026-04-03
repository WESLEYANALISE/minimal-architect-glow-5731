
-- Update the plan_type check constraint to include anual and anual_oferta while keeping legacy values
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;

ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_type_check 
  CHECK (plan_type IN ('mensal', 'trimestral', 'semestral', 'anual', 'vitalicio', 'vitalicio_oferta', 'anual_oferta', 'essencial', 'pro'));
