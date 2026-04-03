-- ============================================================
-- CONFIGURAÇÃO DO CRON JOB PARA PUSH AGENDADOS
-- ============================================================
-- Execute este SQL no Supabase SQL Editor para configurar
-- o envio automático de notificações push agendadas.
--
-- O cron roda a cada 1 minuto e processa até 10 pushes pendentes.
-- ============================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- REMOVER CRON JOB ANTIGO (se existir)
-- ============================================================
SELECT cron.unschedule('cron-push-agendados');

-- ============================================================
-- CRON JOB: Push Agendados (a cada 1 minuto)
-- ============================================================
SELECT cron.schedule(
  'cron-push-agendados',
  '* * * * *', -- a cada 1 minuto
  $$
  SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/cron-push-agendados',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================
-- VERIFICAR CRON JOB CRIADO
-- ============================================================
SELECT * FROM cron.job WHERE jobname = 'cron-push-agendados';
