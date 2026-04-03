-- Corrigir TODAS as assinaturas vitalícias que estão com status pending
UPDATE subscriptions 
SET status = 'authorized' 
WHERE plan_type = 'vitalicio' AND status = 'pending';