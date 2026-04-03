-- Inserir assinatura para Náyra (pagamento externo 3 meses)
INSERT INTO subscriptions (user_id, status, plan_type, amount, payment_method, mp_payer_email, expiration_date, conversion_source)
VALUES (
  '32d74b0c-d906-4a3a-87fa-d62ba74f46de',
  'authorized',
  'trimestral',
  49.90,
  'externo',
  'almeidanayra71@gmail.com',
  (NOW() + INTERVAL '90 days')::timestamptz,
  'pagamento_externo'
);

-- Ativar como premium
INSERT INTO usuarios_premium (user_id, status_premium, data_ativacao)
VALUES ('32d74b0c-d906-4a3a-87fa-d62ba74f46de', true, NOW())
ON CONFLICT (user_id) DO UPDATE SET
  status_premium = true,
  data_ativacao = NOW(),
  updated_at = NOW();