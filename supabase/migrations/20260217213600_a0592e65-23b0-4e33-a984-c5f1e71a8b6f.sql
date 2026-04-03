CREATE OR REPLACE FUNCTION contar_questoes_por_materias(materia_ids bigint[])
RETURNS TABLE(materia_id bigint, questoes_count bigint) AS $$
  SELECT ct.materia_id, 
    SUM(COALESCE(jsonb_array_length(ct.questoes), 0))::bigint as questoes_count
  FROM categorias_topicos ct
  WHERE ct.materia_id = ANY(materia_ids)
  GROUP BY ct.materia_id
$$ LANGUAGE sql STABLE;