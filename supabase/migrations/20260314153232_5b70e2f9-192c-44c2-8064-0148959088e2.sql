-- Fix ID 995 using jsonb_set for the title field
UPDATE categorias_topicos SET conteudo_gerado = 
  jsonb_set(conteudo_gerado::jsonb, '{titulo}', to_jsonb('CONSTITUIÇÃO DE 1967, A.I. 5 E "CONSTITUIÇÃO" DE 1969'::text))
WHERE id = 995;

-- Also fix the first slide title
UPDATE categorias_topicos SET conteudo_gerado = 
  jsonb_set(conteudo_gerado::jsonb, '{secoes,0,slides,0,titulo}', to_jsonb('CONSTITUIÇÃO DE 1967, A.I. 5 E "CONSTITUIÇÃO" DE 1969'::text))
WHERE id = 995;