
-- 1. Enable RLS on all public tables that are missing it

ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_agronegocio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_bancario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_comparado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_contratual ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_desportivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_digital ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_energia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_familia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_filosofia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_hermeneutica ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_imobiliario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_internacional_privado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_internacional_publico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_jurisprudencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_lgpd ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_maritimo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_mediacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_militar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_pratica_juridica ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_previdenciario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_processo_civil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_processo_penal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_processo_trabalho ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_saude ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_sociologia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_sucessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogger_urbanistico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evelyn_mensagens_processadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oab_etica_paginas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oab_geracao_regras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oab_geracao_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_aulas_dias ENABLE ROW LEVEL SECURITY;

-- 2. Public read policies for content tables (blog, areas, aulas, modulos, etc.)

CREATE POLICY "Allow public read" ON public.areas FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.aulas FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.modulos FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.oab_etica_paginas FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.oab_geracao_regras FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.oab_geracao_templates FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.video_aulas_dias FOR SELECT USING (true);

CREATE POLICY "Allow public read" ON public.blogger_agronegocio FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.blogger_bancario FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.blogger_comparado FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.blogger_compliance FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.blogger_contratual FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.blogger_desportivo FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.blogger_digital FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.blogger_energia FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.blogger_familia FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.blogger_filosofia FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.blogger_financeiro FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.blogger_hermeneutica FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.blogger_imobiliario FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.blogger_internacional_privado FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.blogger_internacional_publico FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.blogger_jurisprudencia FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.blogger_lgpd FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.blogger_maritimo FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.blogger_mediacao FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.blogger_militar FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.blogger_pratica_juridica FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.blogger_previdenciario FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.blogger_processo_civil FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.blogger_processo_penal FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.blogger_processo_trabalho FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.blogger_saude FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.blogger_sociologia FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.blogger_startups FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.blogger_sucessoes FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.blogger_urbanistico FOR SELECT USING (true);

-- 3. evelyn_mensagens_processadas - service role only (contains phone numbers)
CREATE POLICY "Service role only" ON public.evelyn_mensagens_processadas 
  FOR ALL USING (false);

-- 4. Fix SECURITY DEFINER view - recreate as SECURITY INVOKER
DROP VIEW IF EXISTS public.vw_status_cache_proposicoes;
CREATE VIEW public.vw_status_cache_proposicoes WITH (security_invoker = true) AS
SELECT 'PLs'::text AS tipo,
    count(*) AS total,
    count(CASE WHEN cache_proposicoes_recentes.autor_principal_foto IS NOT NULL THEN 1 ELSE NULL END) AS com_foto,
    round(count(CASE WHEN cache_proposicoes_recentes.autor_principal_foto IS NOT NULL THEN 1 ELSE NULL END)::numeric / NULLIF(count(*)::numeric, 0) * 100, 2) AS percentual_foto,
    max(cache_proposicoes_recentes.updated_at) AS ultima_atualizacao,
    min(cache_proposicoes_recentes.data_apresentacao) AS data_mais_antiga,
    max(cache_proposicoes_recentes.data_apresentacao) AS data_mais_recente
   FROM cache_proposicoes_recentes
  WHERE cache_proposicoes_recentes.sigla_tipo = 'PL'
UNION ALL
 SELECT 'PLPs'::text AS tipo,
    count(*) AS total,
    count(CASE WHEN cache_plp_recentes.autor_principal_foto IS NOT NULL THEN 1 ELSE NULL END) AS com_foto,
    round(count(CASE WHEN cache_plp_recentes.autor_principal_foto IS NOT NULL THEN 1 ELSE NULL END)::numeric / NULLIF(count(*)::numeric, 0) * 100, 2) AS percentual_foto,
    max(cache_plp_recentes.updated_at) AS ultima_atualizacao,
    min(cache_plp_recentes.data_apresentacao) AS data_mais_antiga,
    max(cache_plp_recentes.data_apresentacao) AS data_mais_recente
   FROM cache_plp_recentes;
