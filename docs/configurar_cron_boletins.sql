-- ============================================================
-- CONFIGURAÇÃO DOS CRON JOBS PARA BOLETINS JURÍDICOS
-- ============================================================
-- Execute este SQL no Supabase SQL Editor para configurar
-- a geração automática do boletim jurídico diário.
--
-- O boletim será gerado às 21:50 horário de Brasília (00:50 UTC)
-- ============================================================

-- Habilitar extensões necessárias (se ainda não estiverem ativas)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- REMOVER CRON JOBS ANTIGOS (executar primeiro)
-- ============================================================
SELECT cron.unschedule('gerar-boletim-direito-diario');
SELECT cron.unschedule('gerar-boletim-concurso-diario');
SELECT cron.unschedule('gerar-boletim-politica-diario');
SELECT cron.unschedule('gerar-boletim-juridica-diario');
SELECT cron.unschedule('verificar-boletins-faltantes');

-- ============================================================
-- CRON JOB 1: Boletim JURÍDICO (10 notícias por dia)
-- ============================================================
SELECT cron.schedule(
  'gerar-boletim-juridica-diario',
  '50 0 * * *', -- 00:50 UTC = 21:50 BRT
  $$
  SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-resumo-diario',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
    body := '{"tipo": "juridica"}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================
-- CRON JOB 2: Verificação e Retry Automático (somente jurídica)
-- Roda às 02:00 BRT para verificar boletins faltantes
-- ============================================================
SELECT cron.schedule(
  'verificar-boletins-faltantes',
  '0 5 * * *', -- 05:00 UTC = 02:00 BRT
  $$
  SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/verificar-boletins-faltantes',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
    body := '{"diasVerificar": 5, "tipos": ["juridica"], "autoRegenerar": true}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================
-- VERIFICAR CRON JOBS CRIADOS
-- ============================================================
SELECT * FROM cron.job WHERE jobname LIKE 'gerar-boletim%' OR jobname LIKE 'verificar-boletins%';

-- ============================================================
-- REMOVER CRONS DE POLÍTICA E CONCURSO (executar manualmente)
-- ============================================================
-- SELECT cron.unschedule('gerar-boletim-politica-diario');
-- SELECT cron.unschedule('gerar-boletim-concurso-diario');
