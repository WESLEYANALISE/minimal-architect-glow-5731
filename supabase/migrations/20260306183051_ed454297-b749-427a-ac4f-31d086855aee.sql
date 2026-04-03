
-- Tabela FLASHCARDS_LACUNAS
CREATE TABLE public."FLASHCARDS_LACUNAS" (
  id BIGSERIAL PRIMARY KEY,
  area TEXT NOT NULL,
  tema TEXT NOT NULL,
  subtema TEXT NOT NULL,
  frase TEXT NOT NULL,
  palavra_correta TEXT NOT NULL,
  palavra_errada TEXT NOT NULL,
  comentario TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public."FLASHCARDS_LACUNAS" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ler lacunas"
  ON public."FLASHCARDS_LACUNAS" FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Service role pode inserir lacunas"
  ON public."FLASHCARDS_LACUNAS" FOR INSERT
  TO service_role WITH CHECK (true);

-- RPC: stats de áreas para lacunas
CREATE OR REPLACE FUNCTION public.get_lacunas_areas_stats()
RETURNS TABLE(area text, total_lacunas bigint, total_temas bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH areas_resumo AS (
    SELECT DISTINCT 
      TRIM(r.area) as area_nome,
      COUNT(DISTINCT LOWER(TRIM(r.tema))) as temas_count
    FROM "RESUMO" r
    WHERE r.area IS NOT NULL AND TRIM(r.area) != ''
    GROUP BY TRIM(r.area)
  ),
  lacunas_count AS (
    SELECT 
      TRIM(f.area) as area_nome,
      COUNT(*)::BIGINT as lc_count
    FROM "FLASHCARDS_LACUNAS" f
    WHERE f.area IS NOT NULL AND TRIM(f.area) != ''
    GROUP BY TRIM(f.area)
  )
  SELECT 
    ar.area_nome::TEXT as area,
    COALESCE(lc.lc_count, 0)::BIGINT as total_lacunas,
    ar.temas_count::BIGINT as total_temas
  FROM areas_resumo ar
  LEFT JOIN lacunas_count lc ON LOWER(TRIM(lc.area_nome)) = LOWER(TRIM(ar.area_nome))
  ORDER BY ar.area_nome;
END;
$$;

-- RPC: stats de temas para lacunas (mesma lógica do get_flashcard_temas_stats)
CREATE OR REPLACE FUNCTION public.get_lacunas_temas_stats(p_area text)
RETURNS TABLE(tema text, total_subtemas bigint, subtemas_gerados bigint, total_lacunas bigint, ordem bigint)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  area_norm text;
BEGIN
  area_norm := LOWER(TRIM(
    translate(
      p_area,
      'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ',
      'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn'
    )
  ));

  RETURN QUERY
  WITH resumo_temas AS (
    SELECT 
      r.tema AS tema_original,
      LOWER(TRIM(translate(r.tema,
        'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ',
        'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn'
      ))) AS tema_norm,
      LOWER(TRIM(translate(COALESCE(r.subtema, ''),
        'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ',
        'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn'
      ))) AS subtema_norm
    FROM "RESUMO" r
    WHERE r.tema IS NOT NULL
      AND LOWER(TRIM(translate(COALESCE(r.area, ''),
        'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ',
        'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn'
      ))) = area_norm
  ),
  temas_agg AS (
    SELECT
      MIN(rt.tema_original) AS nome_original,
      rt.tema_norm,
      COUNT(DISTINCT rt.subtema_norm) FILTER (WHERE rt.subtema_norm != '') AS cnt_subtemas,
      ROW_NUMBER() OVER (ORDER BY MIN(rt.tema_original)) AS ordem_seq
    FROM resumo_temas rt
    GROUP BY rt.tema_norm
  ),
  fc AS (
    SELECT
      LOWER(TRIM(translate(f.tema,
        'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ',
        'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn'
      ))) AS tema_norm,
      LOWER(TRIM(translate(COALESCE(f.subtema, ''),
        'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ',
        'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn'
      ))) AS subtema_norm
    FROM "FLASHCARDS_LACUNAS" f
    WHERE f.tema IS NOT NULL
      AND LOWER(TRIM(translate(COALESCE(f.area, ''),
        'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ',
        'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn'
      ))) = area_norm
  ),
  fc_agg AS (
    SELECT
      fc.tema_norm,
      COUNT(DISTINCT fc.subtema_norm) FILTER (WHERE fc.subtema_norm != '') AS cnt_subtemas_gerados,
      COUNT(*)::BIGINT AS cnt_lacunas
    FROM fc
    GROUP BY fc.tema_norm
  )
  SELECT
    ta.nome_original::TEXT AS tema,
    ta.cnt_subtemas::BIGINT AS total_subtemas,
    COALESCE(fa.cnt_subtemas_gerados, 0)::BIGINT AS subtemas_gerados,
    COALESCE(fa.cnt_lacunas, 0)::BIGINT AS total_lacunas,
    ta.ordem_seq::BIGINT AS ordem
  FROM temas_agg ta
  LEFT JOIN fc_agg fa ON fa.tema_norm = ta.tema_norm
  ORDER BY ta.ordem_seq;
END;
$$;
