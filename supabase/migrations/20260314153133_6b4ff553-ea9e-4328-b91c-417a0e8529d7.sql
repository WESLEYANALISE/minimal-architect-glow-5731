-- Fix truncated titles inside conteudo_gerado JSON for all affected topics

-- ID 988: "DA INDEPENDÊNCIA À CONSTITUIÇÃO DE" → + 1824
UPDATE categorias_topicos SET conteudo_gerado = 
  regexp_replace(conteudo_gerado::text, 'DA INDEPENDÊNCIA À CONSTITUIÇÃO DE([^0-9])', 'DA INDEPENDÊNCIA À CONSTITUIÇÃO DE 1824\1', 'g')::jsonb
WHERE id = 988 AND conteudo_gerado IS NOT NULL;

-- ID 989: "CONSTITUIÇÃO DE" alone → + 1891 (only at title level, careful with other mentions)
UPDATE categorias_topicos SET conteudo_gerado = 
  jsonb_set(
    jsonb_set(conteudo_gerado::jsonb, '{titulo}', '"CONSTITUIÇÃO DE 1891"'),
    '{secoes,0,slides,0,titulo}', '"CONSTITUIÇÃO DE 1891"'
  )
WHERE id = 989 AND conteudo_gerado IS NOT NULL;

-- ID 990
UPDATE categorias_topicos SET conteudo_gerado = 
  regexp_replace(conteudo_gerado::text, 'DO IMPÉRIO À PROCLAMAÇÃO DA REPÚBLICA E A CONSTITUIÇÃO DE([^0-9])', 'DO IMPÉRIO À PROCLAMAÇÃO DA REPÚBLICA E A CONSTITUIÇÃO DE 1891\1', 'g')::jsonb
WHERE id = 990 AND conteudo_gerado IS NOT NULL;

-- ID 991
UPDATE categorias_topicos SET conteudo_gerado = 
  regexp_replace(conteudo_gerado::text, 'REPÚBLICA VELHA, REVOLUÇÃO DE 1930 E A CONSTITUIÇÃO DE([^0-9])', 'REPÚBLICA VELHA, REVOLUÇÃO DE 1930 E A CONSTITUIÇÃO DE 1934\1', 'g')::jsonb
WHERE id = 991 AND conteudo_gerado IS NOT NULL;

-- ID 992
UPDATE categorias_topicos SET conteudo_gerado = 
  regexp_replace(conteudo_gerado::text, 'O ESTADO NOVO E A CONSTITUIÇÃO DE([^0-9])', 'O ESTADO NOVO E A CONSTITUIÇÃO DE 1937\1', 'g')::jsonb
WHERE id = 992 AND conteudo_gerado IS NOT NULL;

-- ID 993
UPDATE categorias_topicos SET conteudo_gerado = 
  regexp_replace(conteudo_gerado::text, 'O GOVERNO DO ESTADO NOVO E A CONSTITUIÇÃO DE([^0-9])', 'O GOVERNO DO ESTADO NOVO E A CONSTITUIÇÃO DE 1946\1', 'g')::jsonb
WHERE id = 993 AND conteudo_gerado IS NOT NULL;

-- ID 994
UPDATE categorias_topicos SET conteudo_gerado = 
  regexp_replace(conteudo_gerado::text, 'DA DEMOCRACIA AO GOLPE MILITAR DE([^0-9])', 'DA DEMOCRACIA AO GOLPE MILITAR DE 1964\1', 'g')::jsonb
WHERE id = 994 AND conteudo_gerado IS NOT NULL;

-- ID 995
UPDATE categorias_topicos SET conteudo_gerado = 
  regexp_replace(conteudo_gerado::text, '"CONSTITUIÇÃO" DE([^0-9])', '"CONSTITUIÇÃO" DE 1969\1', 'g')::jsonb
WHERE id = 995 AND conteudo_gerado IS NOT NULL;

-- ID 997
UPDATE categorias_topicos SET conteudo_gerado = 
  jsonb_set(
    jsonb_set(conteudo_gerado::jsonb, '{titulo}', '"CONSTITUIÇÃO FEDERAL DE 1988"'),
    '{secoes,0,slides,0,titulo}', '"CONSTITUIÇÃO FEDERAL DE 1988"'
  )
WHERE id = 997 AND conteudo_gerado IS NOT NULL;

-- ID 2023
UPDATE categorias_topicos SET conteudo_gerado = 
  regexp_replace(conteudo_gerado::text, 'DIREITOS FUNDAMENTAIS NA CONSTITUIÇÃO FEDERAL DE([^0-9])', 'DIREITOS FUNDAMENTAIS NA CONSTITUIÇÃO FEDERAL DE 1988\1', 'g')::jsonb
WHERE id = 2023 AND conteudo_gerado IS NOT NULL;

-- ID 3274
UPDATE categorias_topicos SET conteudo_gerado = 
  regexp_replace(conteudo_gerado::text, 'PIS/PASEP NA CONSTITUIÇÃO DE([^0-9])', 'PIS/PASEP NA CONSTITUIÇÃO DE 1988\1', 'g')::jsonb
WHERE id = 3274 AND conteudo_gerado IS NOT NULL;