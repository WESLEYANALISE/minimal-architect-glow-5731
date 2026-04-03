
-- Re-inserir artigos do preâmbulo do Decreto-Lei com marcação especial
INSERT INTO "CLT - Consolidação das Leis do Trabalho" (id, "Número do Artigo", "Artigo", ordem_artigo)
VALUES 
(1, 'Art. 1º', E'Fica aprovada a Consolidação das Leis do Trabalho, que a este decreto-lei acompanha, com as alterações por ela introduzidas na legislação vigente.\n\nParágrafo único. Continuam em vigor as disposições legais transitórias ou de emergência, bem como as que não tenham aplicação em todo o território nacional.', 1),
(2, 'Art. 2º', E'O presente decreto-lei entrará em vigor em 10 de novembro de 1943.\n\nRio de Janeiro, 1 de maio de 1943, 122º da Independência e 55º da República.\n\nGetúlio Vargas.\nAlexandre Marcondes Filho.', 2)
ON CONFLICT (id) DO UPDATE SET "Número do Artigo" = EXCLUDED."Número do Artigo", "Artigo" = EXCLUDED."Artigo", ordem_artigo = EXCLUDED.ordem_artigo;

-- Ajustar ordem dos artigos reais para começar depois do preâmbulo
UPDATE "CLT - Consolidação das Leis do Trabalho" SET ordem_artigo = 3 WHERE id = 4;
UPDATE "CLT - Consolidação das Leis do Trabalho" SET ordem_artigo = 4 WHERE id = 5;
