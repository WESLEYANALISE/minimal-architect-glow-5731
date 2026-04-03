
-- Atualizar periodo_teste_expirado para usuarios cujo tempo de teste já passou
UPDATE evelyn_usuarios
SET periodo_teste_expirado = true
WHERE periodo_teste_expirado = false
  AND EXTRACT(EPOCH FROM (now() - COALESCE(teste_inicio, data_primeiro_contato, created_at))) / 60 > COALESCE(tempo_teste_minutos, 4320);
