
-- Cron job diário à meia-noite (UTC) para auto-expirar assinaturas
SELECT cron.schedule(
  'auto-expirar-assinaturas',
  '0 3 * * *',
  $$SELECT public.auto_expirar_assinaturas();$$
);
