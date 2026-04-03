-- ============================================================
-- CONFIGURAÇÃO DO CRON JOB PARA FILME DO DIA
-- ============================================================
-- Execute este SQL no Supabase SQL Editor para configurar
-- a geração automática do Filme do Dia.
--
-- O filme será gerado às 18:00 BRT (21:00 UTC) todos os dias.
-- ============================================================

-- As extensões pg_cron e pg_net já estão ativas no Supabase.
-- NÃO executar CREATE EXTENSION pois causa erro de privilégios.

-- ============================================================
-- REMOVER CRON JOB ANTIGO (executar primeiro)
-- ============================================================
SELECT cron.unschedule('gerar-filme-do-dia-diario');

-- ============================================================
-- CRON JOB: Gerar Filme do Dia (18:00 BRT = 21:00 UTC)
-- ============================================================
SELECT cron.schedule(
  'gerar-filme-do-dia-diario',
  '0 21 * * *', -- 21:00 UTC = 18:00 BRT
  $$
  SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-filme-do-dia',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================
-- VERIFICAR CRON JOB CRIADO
-- ============================================================
SELECT * FROM cron.job WHERE jobname = 'gerar-filme-do-dia-diario';

-- ============================================================
-- COMANDOS ÚTEIS (executar manualmente quando necessário)
-- ============================================================

-- Remover o cron do filme do dia:
-- SELECT cron.unschedule('gerar-filme-do-dia-diario');

-- Executar manualmente a edge function (via SQL):
-- SELECT net.http_post(
--   url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-filme-do-dia',
--   headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
--   body := '{}'::jsonb
-- ) AS request_id;

-- ============================================================
-- CRON JOB: Narração do Filme do Dia (18:05 BRT = 21:05 UTC)
-- ============================================================
-- Executar APÓS o cron do filme do dia (5 min de margem)

-- Remover cron antigo da narração (executar primeiro):
-- SELECT cron.unschedule('gerar-narracao-filme-diario');

SELECT cron.schedule(
  'gerar-narracao-filme-diario',
  '5 21 * * *', -- 21:05 UTC = 18:05 BRT
  $$
  SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-narracao-filme',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Verificar cron da narração:
-- SELECT * FROM cron.job WHERE jobname = 'gerar-narracao-filme-diario';

-- Executar narração manualmente:
-- SELECT net.http_post(
--   url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-narracao-filme',
--   headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
--   body := '{"filme_id": 9}'::jsonb
-- ) AS request_id;
