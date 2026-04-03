-- Atualizar constraint para incluir trimestral e manter legados para compatibilidade
ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_plan_type_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_type_check CHECK (plan_type = ANY (ARRAY['mensal', 'trimestral', 'anual', 'essencial', 'pro', 'vitalicio']));

-- Corrigir registro da Juliana
UPDATE subscriptions SET plan_type = 'trimestral', amount = 49.90 WHERE id = '2e203046-80b4-4a3d-b6ea-373af59fb0b4';