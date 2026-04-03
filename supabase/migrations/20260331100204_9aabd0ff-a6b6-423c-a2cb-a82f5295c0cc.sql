
-- RPC 1: Contagens de todas as bibliotecas em uma única query
CREATE OR REPLACE FUNCTION public.get_biblioteca_counts()
RETURNS TABLE(
  estudos bigint,
  classicos bigint,
  portugues bigint,
  pesquisa bigint,
  oratoria bigint,
  oab bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    (SELECT COUNT(*) FROM "BIBLIOTECA-ESTUDOS")::bigint as estudos,
    (SELECT COUNT(*) FROM "BIBLIOTECA-CLASSICOS")::bigint as classicos,
    (SELECT COUNT(*) FROM "BIBLIOTECA-PORTUGUES")::bigint as portugues,
    (SELECT COUNT(*) FROM "BIBLIOTECA-PESQUISA-CIENTIFICA")::bigint as pesquisa,
    (SELECT COUNT(*) FROM "BIBLIOTECA-ORATORIA")::bigint as oratoria,
    (SELECT COUNT(*) FROM "BIBILIOTECA-OAB")::bigint as oab;
$$;

-- RPC 2: Contagens de resumos consolidadas
CREATE OR REPLACE FUNCTION public.get_resumos_counts()
RETURNS TABLE(
  resumos_materia bigint,
  resumos_artigos_lei bigint,
  resumos_cornell bigint,
  resumos_feynman bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    (SELECT COUNT(*) FROM "RESUMO")::bigint as resumos_materia,
    (SELECT COUNT(*) FROM "RESUMOS_ARTIGOS_LEI")::bigint as resumos_artigos_lei,
    (SELECT COUNT(*) FROM "METODOLOGIAS_GERADAS" WHERE metodo = 'cornell')::bigint as resumos_cornell,
    (SELECT COUNT(*) FROM "METODOLOGIAS_GERADAS" WHERE metodo = 'feynman')::bigint as resumos_feynman;
$$;
