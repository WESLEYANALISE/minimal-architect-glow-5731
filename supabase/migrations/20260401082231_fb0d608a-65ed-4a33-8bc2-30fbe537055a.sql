DELETE FROM public.explicacoes_artigos_fila 
WHERE numero_artigo !~ '^\d+[ºª°]?[A-Za-z]?(-[A-Z])?$';