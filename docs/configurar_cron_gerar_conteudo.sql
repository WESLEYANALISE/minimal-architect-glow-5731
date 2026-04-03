-- ============================================================
-- CRON JOB: Gerar Conteúdo Pendente (Flashcards, Questões, Lacunas)
-- Executa a cada 1 minuto
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'cron-gerar-conteudo-pendente',
  '*/1 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/cron-gerar-conteudo-pendente',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
