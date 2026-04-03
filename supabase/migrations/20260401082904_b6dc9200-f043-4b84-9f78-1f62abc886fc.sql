DELETE FROM "RESUMOS_ARTIGOS_LEI" WHERE area = 'Código Eleitoral';

UPDATE explicacoes_artigos_fila 
SET status = 'pendente', erro = NULL 
WHERE tabela_lei = 'CE – Código Eleitoral' 
AND status = 'concluido';