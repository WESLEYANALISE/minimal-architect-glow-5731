-- ============================================================
-- CONFIGURAÇÃO DO CRON JOB PARA GERAÇÃO AUTOMÁTICA DE METODOLOGIAS
-- ============================================================
-- Execute este SQL no Supabase SQL Editor para configurar
-- a geração automática de metodologias (Cornell, Feynman, Mapa Mental).
--
-- O cron roda a cada 1 minuto e processa até 10 itens por execução
-- (~5s entre cada item), totalizando ~10 gerações por minuto.
-- ============================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- REMOVER CRON JOB ANTIGO (se existir)
-- ============================================================
SELECT cron.unschedule('cron-gerar-metodologias');

-- ============================================================
-- CRON JOB: Geração de Metodologias (a cada 1 minuto)
-- ============================================================
SELECT cron.schedule(
  'cron-gerar-metodologias',
  '* * * * *', -- a cada 1 minuto
  $$
  SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/cron-gerar-metodologias',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================
-- VERIFICAR CRON JOB CRIADO
-- ============================================================
SELECT * FROM cron.job WHERE jobname = 'cron-gerar-metodologias';
