-- ============================================================
-- CONFIGURAÇÃO DOS CRON JOBS PARA CENTRAL DE NOTIFICAÇÕES
-- ============================================================
-- Execute este SQL no Supabase SQL Editor para configurar
-- os 3 horários de disparo automático de notificações.
--
-- Horários BRT → UTC:
-- 08:00 BRT = 11:00 UTC
-- 14:00 BRT = 17:00 UTC
-- 20:00 BRT = 23:00 UTC
-- ============================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- REMOVER CRON JOBS ANTIGOS (se existirem)
-- ============================================================
SELECT cron.unschedule('notificacoes-08h');
SELECT cron.unschedule('notificacoes-14h');
SELECT cron.unschedule('notificacoes-20h');

-- ============================================================
-- CRON JOB 1: Notificações 08:00 BRT (11:00 UTC)
-- ============================================================
SELECT cron.schedule(
  'notificacoes-08h',
  '0 11 * * *',
  $$
  SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/cron-notificacoes-agendadas',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
    body := '{"horario": "08:00"}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================
-- CRON JOB 2: Notificações 14:00 BRT (17:00 UTC)
-- ============================================================
SELECT cron.schedule(
  'notificacoes-14h',
  '0 17 * * *',
  $$
  SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/cron-notificacoes-agendadas',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
    body := '{"horario": "14:00"}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================
-- CRON JOB 3: Notificações 20:00 BRT (23:00 UTC)
-- ============================================================
SELECT cron.schedule(
  'notificacoes-20h',
  '0 23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/cron-notificacoes-agendadas',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
    body := '{"horario": "20:00"}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================
-- VERIFICAR CRON JOBS CRIADOS
-- ============================================================
SELECT * FROM cron.job WHERE jobname LIKE 'notificacoes-%';
