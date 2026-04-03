INSERT INTO subscriptions (user_id, plan_type, status, amount, mp_payment_id, mp_payer_email, payment_method, expiration_date)
VALUES (
  '74ea75c3-b29d-469f-a0a6-0dc29ab00041',
  'semestral',
  'authorized',
  49.90,
  '148008860912',
  (SELECT email FROM profiles WHERE id = '74ea75c3-b29d-469f-a0a6-0dc29ab00041'),
  'pix',
  NOW() + INTERVAL '180 days'
);