
-- Corrigir títulos truncados na tabela categorias_topicos

-- Matéria 118 - História Constitucional do Brasil
UPDATE categorias_topicos SET titulo = 'DA INDEPENDÊNCIA À CONSTITUIÇÃO DE 1824' WHERE id = 988;
UPDATE categorias_topicos SET titulo = 'CONSTITUIÇÃO DE 1891' WHERE id = 989;
UPDATE categorias_topicos SET titulo = 'DO IMPÉRIO À PROCLAMAÇÃO DA REPÚBLICA E A CONSTITUIÇÃO DE 1891' WHERE id = 990;
UPDATE categorias_topicos SET titulo = 'REPÚBLICA VELHA, REVOLUÇÃO DE 1930 E A CONSTITUIÇÃO DE 1934' WHERE id = 991;
UPDATE categorias_topicos SET titulo = 'O ESTADO NOVO E A CONSTITUIÇÃO DE 1937' WHERE id = 992;
UPDATE categorias_topicos SET titulo = 'O GOVERNO DO ESTADO NOVO E A CONSTITUIÇÃO DE 1946' WHERE id = 993;
UPDATE categorias_topicos SET titulo = 'DA DEMOCRACIA AO GOLPE MILITAR DE 1964' WHERE id = 994;
UPDATE categorias_topicos SET titulo = 'CONSTITUIÇÃO DE 1967, A.I. 5 E "CONSTITUIÇÃO" DE 1969' WHERE id = 995;
UPDATE categorias_topicos SET titulo = 'CONSTITUIÇÃO FEDERAL DE 1988' WHERE id = 997;

-- Outras matérias
UPDATE categorias_topicos SET titulo = 'Estrutura da Constituição Federal de 1988' WHERE id = 533;
UPDATE categorias_topicos SET titulo = 'DIREITOS FUNDAMENTAIS NA CONSTITUIÇÃO FEDERAL DE 1988' WHERE id = 2023;
UPDATE categorias_topicos SET titulo = 'PIS/PASEP NA CONSTITUIÇÃO DE 1988' WHERE id = 3274;
