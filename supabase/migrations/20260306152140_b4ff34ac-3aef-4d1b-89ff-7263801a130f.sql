
CREATE OR REPLACE FUNCTION public.get_flashcard_temas_stats(p_area text)
RETURNS TABLE(
  tema text,
  total_subtemas bigint,
  subtemas_gerados bigint,
  total_flashcards bigint,
  ordem bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  area_norm text;
BEGIN
  -- Normalizar área de entrada (remover acentos, lowercase, trim)
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
  -- Aggregate subtemas per tema from RESUMO
  temas_agg AS (
    SELECT
      MIN(rt.tema_original) AS nome_original,
      rt.tema_norm,
      COUNT(DISTINCT rt.subtema_norm) FILTER (WHERE rt.subtema_norm != '') AS cnt_subtemas,
      ROW_NUMBER() OVER (ORDER BY MIN(rt.tema_original)) AS ordem_seq
    FROM resumo_temas rt
    GROUP BY rt.tema_norm
  ),
  -- Flashcards gerados per tema
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
    FROM "FLASHCARDS_GERADOS" f
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
      COUNT(*)::BIGINT AS cnt_flashcards
    FROM fc
    GROUP BY fc.tema_norm
  )
  SELECT
    ta.nome_original::TEXT AS tema,
    ta.cnt_subtemas::BIGINT AS total_subtemas,
    COALESCE(fa.cnt_subtemas_gerados, 0)::BIGINT AS subtemas_gerados,
    COALESCE(fa.cnt_flashcards, 0)::BIGINT AS total_flashcards,
    ta.ordem_seq::BIGINT AS ordem
  FROM temas_agg ta
  LEFT JOIN fc_agg fa ON fa.tema_norm = ta.tema_norm
  ORDER BY ta.ordem_seq;
END;
$function$;
