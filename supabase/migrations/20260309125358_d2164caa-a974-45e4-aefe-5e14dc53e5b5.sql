-- Limpar subscriptions pendentes antigas (PIX expirados e cartões em análise manual)
-- PIX: mais de 24h pendente = nunca será pago (QR Code expira em ~30min)
-- Credit card pending: mais de 7 dias = análise manual provavelmente expirou

UPDATE subscriptions
SET status = 'expired'
WHERE status = 'pending'
  AND (
    (payment_method = 'pix' AND created_at < NOW() - INTERVAL '24 hours')
    OR
    (payment_method = 'credit_card' AND created_at < NOW() - INTERVAL '7 days')
  );