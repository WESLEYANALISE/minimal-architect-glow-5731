
-- ============================================================
-- RPC: get_app_statistics (substitui 13 queries paralelas)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_app_statistics()
RETURNS TABLE(
  flashcards bigint,
  videoaulas bigint,
  audioaulas bigint,
  livros_estudos bigint,
  livros_fora_da_toga bigint,
  livros_classicos bigint,
  livros_lideranca bigint,
  livros_oratoria bigint,
  resumos bigint,
  questoes_oab bigint,
  cursos_aulas bigint,
  casos_simulacao bigint,
  mapas_mentais bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    (SELECT COUNT(*) FROM "FLASHCARDS_GERADOS")::bigint,
    (SELECT COUNT(*) FROM "VIDEO AULAS-NOVO")::bigint,
    (SELECT COUNT(*) FROM "AUDIO-AULA")::bigint,
    (SELECT COUNT(*) FROM "BIBLIOTECA-ESTUDOS")::bigint,
    (SELECT COUNT(*) FROM "BIBLIOTECA-FORA-DA-TOGA")::bigint,
    (SELECT COUNT(*) FROM "BIBLIOTECA-CLASSICOS")::bigint,
    (SELECT COUNT(*) FROM "BIBLIOTECA-LIDERANÇA")::bigint,
    (SELECT COUNT(*) FROM "BIBLIOTECA-ORATORIA")::bigint,
    (SELECT COUNT(*) FROM "RESUMO")::bigint,
    (SELECT COUNT(*) FROM "SIMULADO-OAB")::bigint,
    (SELECT COUNT(*) FROM "CURSOS")::bigint,
    (SELECT COUNT(*) FROM "SIMULACAO_CASOS")::bigint,
    (SELECT COUNT(*) FROM "MAPA MENTAL")::bigint;
$$;

-- ============================================================
-- RPC: get_vademecum_counts (substitui 14 queries paralelas)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_vademecum_counts()
RETURNS TABLE(
  legislacao_penal bigint,
  previdenciario bigint,
  sumulas bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    (
      (SELECT COUNT(*) FROM "Lei 11.340 de 2006 - Maria da Penha") +
      (SELECT COUNT(*) FROM "Lei 11.343 de 2006 - Lei de Drogas") +
      (SELECT COUNT(*) FROM "Lei 12.850 de 2013 - Organizações Criminosas") +
      (SELECT COUNT(*) FROM "Lei 13.869 de 2019 - Abuso de Autoridade") +
      (SELECT COUNT(*) FROM "Lei 7.210 de 1984 - Lei de Execução Penal") +
      (SELECT COUNT(*) FROM "Lei 8.072 de 1990 - Crimes Hediondos") +
      (SELECT COUNT(*) FROM "Lei 9.296 de 1996 - Interceptação Telefônica") +
      (SELECT COUNT(*) FROM "Lei 9.455 de 1997 - Tortura") +
      (SELECT COUNT(*) FROM "LLD - Lei de Lavagem de Dinheiro")
    )::bigint,
    (
      (SELECT COUNT(*) FROM "LEI 8212 - Custeio") +
      (SELECT COUNT(*) FROM "LEI 8213 - Benefícios")
    )::bigint,
    (
      (SELECT COUNT(*) FROM "SUMULAS STF") +
      (SELECT COUNT(*) FROM "SUMULAS STJ") +
      (SELECT COUNT(*) FROM "SUMULAS VINCULANTES")
    )::bigint;
$$;

-- ============================================================
-- ÍNDICES em tabelas de alto tráfego
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_questoes_area_tema ON "QUESTOES_GERADAS"(area, tema);
CREATE INDEX IF NOT EXISTS idx_resumos_area_tema ON "RESUMO"(area, tema);
CREATE INDEX IF NOT EXISTS idx_flashcards_gerados_area ON "FLASHCARDS_GERADOS"(area);
CREATE INDEX IF NOT EXISTS idx_flashcards_gerados_area_tema ON "FLASHCARDS_GERADOS"(area, tema);
CREATE INDEX IF NOT EXISTS idx_artigo_ai_cache_lookup ON artigo_ai_cache(tabela_nome, artigo_numero, modo);
CREATE INDEX IF NOT EXISTS idx_flashcards_lacunas_area ON "FLASHCARDS_LACUNAS"(area);
CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at);

-- ============================================================
-- pg_cron: Agendar funções de manutenção existentes
-- ============================================================
SELECT cron.schedule('reset-daily-limits', '0 3 * * *', $$SELECT public.reset_daily_limits()$$);
SELECT cron.schedule('auto-expirar-assinaturas', '0 * * * *', $$SELECT public.auto_expirar_assinaturas()$$);
SELECT cron.schedule('limpar-noticias-antigas', '0 4 * * *', $$SELECT public.limpar_noticias_antigas(7)$$);
SELECT cron.schedule('limpar-cache-proposicoes', '0 5 * * 0', $$SELECT public.limpar_cache_proposicoes_antigo()$$);
