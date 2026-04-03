
ALTER TABLE subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;

ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_plan_type_check
CHECK (plan_type IN ('mensal', 'trimestral', 'semestral', 'anual', 'essencial', 'pro', 'vitalicio'));
