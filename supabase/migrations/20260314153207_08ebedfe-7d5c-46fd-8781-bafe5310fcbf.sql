-- Fix ID 995: replace the exact truncated title string in the JSON
UPDATE categorias_topicos SET conteudo_gerado = 
  replace(conteudo_gerado::text, 'A.I. 5 E "CONSTITUIÇÃO" DE"', 'A.I. 5 E "CONSTITUIÇÃO" DE 1969"')::jsonb
WHERE id = 995 AND conteudo_gerado IS NOT NULL;

-- Also fix in conteudo text body (escaped quotes in JSON)
UPDATE categorias_topicos SET conteudo_gerado = 
  replace(conteudo_gerado::text, 'A.I. 5 E \\\"CONSTITUIÇÃO\\\" DE"', 'A.I. 5 E \\\"CONSTITUIÇÃO\\\" DE 1969"')::jsonb
WHERE id = 995 AND conteudo_gerado IS NOT NULL;