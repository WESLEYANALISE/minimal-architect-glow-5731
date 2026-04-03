-- ============================================================
-- CONFIGURAÇÃO DO CRON JOB PARA GERAÇÃO AUTOMÁTICA DE AULAS
-- ============================================================
-- Execute este SQL no Supabase SQL Editor para configurar
-- o pipeline automático de geração de aulas por área.
--
-- O cron roda a cada 5 minutos e processa 1 matéria por vez.
-- ============================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- REMOVER CRON JOB ANTIGO (se existir)
-- ============================================================
SELECT cron.unschedule('cron-gerar-aulas-areas');

-- ============================================================
-- CRON JOB: Geração de Aulas (a cada 5 minutos)
-- ============================================================
SELECT cron.schedule(
  'cron-gerar-aulas-areas',
  '*/5 * * * *', -- a cada 5 minutos
  $$
  SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/cron-gerar-aulas-areas',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================
-- VERIFICAR CRON JOB CRIADO
-- ============================================================
SELECT * FROM cron.job WHERE jobname = 'cron-gerar-aulas-areas';
