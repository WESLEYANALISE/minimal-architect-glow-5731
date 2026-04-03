
-- Corrigir Art. 918 com texto completo (o "art. 1º" era continuação dele)
UPDATE "CLT - Consolidação das Leis do Trabalho"
SET "Artigo" = E'Enquanto não for expedida a Lei Orgânica da Previdência Social, competirá ao presidente do Tribunal Superior do Trabalho julgar os recursos interpostos com apoio no art. 1º, alínea "c", do Decreto-lei nº 3.710, de 14 de outubro de 1941, cabendo recurso de suas decisões nos termos do disposto no art. 734, alínea "b", desta Consolidação.\n\nParágrafo único - Ao diretor do Departamento de Previdência Social incumbirá presidir as eleições para a constituição dos Conselhos Fiscais dos Institutos e Caixas de Aposentadoria e Pensões e julgar, com recurso para a instância superior, os recursos sobre matéria tecnico-administrativa dessas instituições.'
WHERE id = 1224;

-- Remover artigos do preâmbulo que não são artigos reais da CLT
DELETE FROM "CLT - Consolidação das Leis do Trabalho" WHERE id IN (1, 2);
