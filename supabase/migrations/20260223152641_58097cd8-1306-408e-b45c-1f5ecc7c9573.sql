-- Passo 1: Remover duplicatas authorized, mantendo apenas a mais recente por (user_id, plan_type)
DELETE FROM subscriptions 
WHERE status = 'authorized'
AND id NOT IN (
  SELECT DISTINCT ON (user_id, plan_type) id
  FROM subscriptions
  WHERE status = 'authorized'
  ORDER BY user_id, plan_type, created_at DESC
);

-- Passo 2: Criar índice único parcial para evitar duplicatas futuras
CREATE UNIQUE INDEX idx_unique_active_subscription 
ON subscriptions (user_id, plan_type) 
WHERE status = 'authorized';