-- Ativar a assinatura que já foi paga via PIX
UPDATE subscriptions 
SET status = 'authorized',
    updated_at = now()
WHERE mp_payment_id = 'pay_jlo9id0k6xowkkkb' 
  AND status = 'pending';

-- Limpar outras subs pending duplicadas do mesmo usuário (manter apenas a autorizada)
DELETE FROM subscriptions 
WHERE user_id = (SELECT user_id FROM subscriptions WHERE mp_payment_id = 'pay_jlo9id0k6xowkkkb' LIMIT 1)
  AND status = 'pending'
  AND mp_payment_id != 'pay_jlo9id0k6xowkkkb';