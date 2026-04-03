-- ============================================================
-- CONFIGURAÇÃO DOS CRON JOBS PARA RECOMENDAÇÃO DO DIA
-- ============================================================
-- Execute este SQL no Supabase SQL Editor para configurar
-- a geração automática da Recomendação do Dia.
--
-- Tudo deve estar pronto às 8:00 BRT para os usuários.
-- Texto às 7:50, imagens às 7:55 e narração às 7:57 BRT.
-- ============================================================

-- Habilitar extensões necessárias (se ainda não estiverem ativas)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- REMOVER CRON JOBS ANTIGOS (executar primeiro)
-- ============================================================
SELECT cron.unschedule('gerar-dica-do-dia-diario');
SELECT cron.unschedule('gerar-imagens-recomendacao-diario');
SELECT cron.unschedule('gerar-narracao-recomendacao-diario');

-- ============================================================
-- CRON JOB 1: Gerar conteúdo + áudio (7:50 BRT = 10:50 UTC)
-- ============================================================
SELECT cron.schedule(
  'gerar-dica-do-dia-diario',
  '50 10 * * *', -- 10:50 UTC = 07:50 BRT
  $$
  SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-dica-do-dia',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================
-- CRON JOB 2: Gerar imagens (7:55 BRT = 10:55 UTC)
-- ============================================================
SELECT cron.schedule(
  'gerar-imagens-recomendacao-diario',
  '55 10 * * *', -- 10:55 UTC = 07:55 BRT
  $$
  SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-imagens-recomendacao',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================
-- CRON JOB 3: Gerar narração (7:57 BRT = 10:57 UTC)
-- ============================================================
SELECT cron.schedule(
  'gerar-narracao-recomendacao-diario',
  '57 10 * * *', -- 10:57 UTC = 07:57 BRT
  $$
  SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-narracao-recomendacao',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================
-- VERIFICAR CRON JOBS CRIADOS
-- ============================================================
SELECT * FROM cron.job WHERE jobname LIKE 'gerar-dica%' OR jobname LIKE 'gerar-imagens-recomendacao%' OR jobname LIKE 'gerar-narracao-recomendacao%';

-- ============================================================
-- COMANDOS ÚTEIS (executar manualmente quando necessário)
-- ============================================================

-- Remover todos os crons da dica do dia:
-- SELECT cron.unschedule('gerar-dica-do-dia-diario');
-- SELECT cron.unschedule('gerar-imagens-recomendacao-diario');
-- SELECT cron.unschedule('gerar-narracao-recomendacao-diario');
