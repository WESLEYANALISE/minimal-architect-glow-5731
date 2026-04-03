UPDATE public.aulas_geracao_fila 
SET status = 'pendente', 
    erro_msg = 'Reset: travado em gerando desde 2026-03-04', 
    updated_at = now() 
WHERE status = 'gerando' 
AND updated_at < '2026-03-11 00:00:00+00';